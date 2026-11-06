'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface PS5Telemetry {
  totalActiveTime: number; // in seconds
  totalRecordCount: number;
  condition: 'brand_new' | 'used';
  activeTimeFormatted: string;
  serialNumber?: string;
  batteryLevel?: number;
  isCharging?: boolean;
}

export interface PS4HardwareInfo {
  manufacturer: string;
  buildDate?: string;
  buildTime?: string;
  isAuthentic: boolean;
  vidPid: string;
  modelCode?: string;
}

const ZU = 1024;
const BU = 8192;
const VU = 1.6;
const HU = 0.35;
const UU = 1.2;
const WU = 0.1;
const GU = 200;

function quatMult(a: Quaternion, b: Quaternion): Quaternion {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}

function quatFromAxisAngle(x: number, y: number, z: number, angle: number): Quaternion {
  const half = angle / 2;
  const s = Math.sin(half);
  return { x: x * s, y: y * s, z: z * s, w: Math.cos(half) };
}

function quatNormalize(q: Quaternion): Quaternion {
  const len = Math.hypot(q.x, q.y, q.z, q.w);
  if (len === 0) return { x: 0, y: 0, z: 0, w: 1 };
  return { x: q.x / len, y: q.y / len, z: q.z / len, w: q.w / len };
}

function quatRotateVector(q: Quaternion, vx: number, vy: number, vz: number) {
  const ix = 2 * (q.y * vz - q.z * vy);
  const iy = 2 * (q.z * vx - q.x * vz);
  const iz = 2 * (q.x * vy - q.y * vx);
  return {
    x: vx + q.w * ix + q.y * iz - q.z * iy,
    y: vy + q.w * iy + q.z * ix - q.x * iz,
    z: vz + q.w * iz + q.x * iy - q.y * ix,
  };
}

export function formatActiveTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} روز`);
  if (hours > 0 || days > 0) parts.push(`${hours} ساعت`);
  parts.push(`${minutes} دقیقه`);
  return parts.join(' و ');
}

export function useWebHIDController() {
  const [isSupported, setIsSupported] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceType, setDeviceType] = useState<'ps5' | 'ps4' | 'other' | null>(null);
  const [orientation, setOrientation] = useState<Quaternion>({ x: 0, y: 0, z: 0, w: 1 });
  const [gyroRates, setGyroRates] = useState({ pitch: 0, yaw: 0, roll: 0 });
  const [motionEnergy, setMotionEnergy] = useState(0); // 0..100
  const [ps5Info, setPs5Info] = useState<PS5Telemetry | null>(null);
  const [ps4Info, setPs4Info] = useState<PS4HardwareInfo | null>(null);

  const hidDeviceRef = useRef<any>(null);
  const quatRef = useRef<Quaternion>({ x: 0, y: 0, z: 0, w: 1 });
  const lastTimeRef = useRef<number>(0);
  const biasRef = useRef({ pitch: 0, yaw: 0, roll: 0 });
  const calibCountRef = useRef(0);
  const isCalibratingRef = useRef(true);
  const calibSumRef = useRef({ pitch: 0, yaw: 0, roll: 0 });
  const motionEnergyAccRef = useRef(0);

  useEffect(() => {
    setIsSupported(typeof navigator !== 'undefined' && 'hid' in navigator);
  }, []);

  const resetOrientation = useCallback(() => {
    quatRef.current = { x: 0, y: 0, z: 0, w: 1 };
    lastTimeRef.current = 0;
    setOrientation({ x: 0, y: 0, z: 0, w: 1 });
  }, []);

  const calibrateGyro = useCallback(() => {
    isCalibratingRef.current = true;
    calibCountRef.current = 0;
    calibSumRef.current = { pitch: 0, yaw: 0, roll: 0 };
  }, []);

  // Update orientation filter with raw gyro/accel
  const processIMU = useCallback((rawGyro: { pitch: number; yaw: number; roll: number }, rawAccel: { x: number; y: number; z: number }) => {
    const now = performance.now();
    if (!lastTimeRef.current) {
      lastTimeRef.current = now;
      return;
    }
    const dt = Math.min((now - lastTimeRef.current) / 1000, WU);
    lastTimeRef.current = now;
    if (dt <= 0) return;

    const pRaw = rawGyro.pitch / ZU;
    const yRaw = rawGyro.yaw / ZU;
    const rRaw = rawGyro.roll / ZU;

    if (isCalibratingRef.current) {
      calibSumRef.current.pitch += pRaw;
      calibSumRef.current.yaw += yRaw;
      calibSumRef.current.roll += rRaw;
      calibCountRef.current += 1;
      if (calibCountRef.current >= GU) {
        biasRef.current.pitch = calibSumRef.current.pitch / calibCountRef.current;
        biasRef.current.yaw = calibSumRef.current.yaw / calibCountRef.current;
        biasRef.current.roll = calibSumRef.current.roll / calibCountRef.current;
        isCalibratingRef.current = false;
      }
      return;
    }

    const pitch = pRaw - biasRef.current.pitch;
    const yaw = yRaw - biasRef.current.yaw;
    const roll = rRaw - biasRef.current.roll;

    const currentRate = Math.hypot(pitch, yaw, roll);
    if (currentRate > 5) {
      motionEnergyAccRef.current = Math.min(100, motionEnergyAccRef.current + currentRate * dt * 3);
      setMotionEnergy(Math.round(motionEnergyAccRef.current));
    }

    let q = quatRef.current;
    if (currentRate > UU) {
      const angle = (currentRate * Math.PI / 180) * dt;
      const rot = quatFromAxisAngle(pitch / currentRate, yaw / currentRate, roll / currentRate, angle);
      q = quatMult(q, rot);
    }

    // Accelerometer gravity correction
    const ax = rawAccel.x / BU;
    const ay = rawAccel.y / BU;
    const az = rawAccel.z / BU;
    const gLen = Math.hypot(ax, ay, az);
    if (gLen > 0 && Math.abs(gLen - 1) < HU) {
      const grav = quatRotateVector(q, -ax / gLen, -ay / gLen, -az / gLen);
      const crossZ = grav.z;
      const crossX = -grav.x;
      const crossLen = Math.hypot(crossZ, 0, crossX);
      if (crossLen > 1e-6) {
        const corrAngle = Math.asin(Math.min(crossLen, 1)) * Math.min(VU * dt, 1);
        const corr = quatFromAxisAngle(crossZ / crossLen, 0, crossX / crossLen, corrAngle);
        q = quatMult(corr, q);
      }
    }

    const normalized = quatNormalize(q);
    quatRef.current = normalized;
    setOrientation({ ...normalized });
    setGyroRates({ pitch: Math.round(pitch), yaw: Math.round(yaw), roll: Math.round(roll) });
  }, []);

  // Read PS5 DualSense Telemetry via WebHID Feature Reports
  const readPS5TelemetryData = useCallback(async (device: any): Promise<PS5Telemetry | null> => {
    try {
      const isEdge = device.productId === 0x0df2;
      let firmwareReport = 0;
      try {
        const fReport = await device.receiveFeatureReport(32);
        firmwareReport = fReport.getUint16(44, true);
      } catch (err) {
        console.warn('Feature report 32 failed, continuing...', err);
      }

      // Feature report 128 (0x80) -> [0x70 (TELEMETRY), 0x01 (GET_INFO)]
      const req = new Uint8Array(2);
      req[0] = 0x70;
      req[1] = 0x01;
      const reportCount =
        device.collections?.[0]?.featureReports?.find((r: any) => r.reportId === 128)?.items?.[0]?.reportCount ?? 64;
      const sendBuf = new Uint8Array(reportCount);
      sendBuf.set(req);
      await device.sendFeatureReport(128, sendBuf);

      const chunkCount = isEdge ? 6 : 4;
      const chunks = new Uint8Array(chunkCount * 56);
      let offset = 0;

      for (let i = 0; i < chunkCount * 4 + 8 && offset < chunkCount; i++) {
        try {
          const rep = await device.receiveFeatureReport(129);
          if (rep && rep.getUint8(0) === 129 && rep.getUint8(1) === 0x70 && rep.getUint8(2) === 0x01) {
            const status = rep.getUint8(3);
            if (status === 0x01 || status === 0x02) {
              chunks.set(new Uint8Array(rep.buffer, 4, 56), offset * 56);
              offset++;
              if (status === 0x01) break;
            }
          }
        } catch {
          // ignore retry
        }
        await new Promise((r) => setTimeout(r, 15));
      }

      if (offset > 0) {
        const dv = new DataView(chunks.buffer);
        let serial = '';
        for (let s = 0; s < 17; s++) {
          const char = dv.getUint8(s);
          if (char === 0) break;
          serial += String.fromCharCode(char);
        }

        const totalRecords = isEdge ? Math.max(0, dv.getUint32(17, true) - 3991928832) : dv.getUint32(17, true);
        const activeRaw = dv.getUint32(21, true) & 0x00ffffff;
        const totalActiveTime = activeRaw < 0xffff00 ? activeRaw : 0;

        // Less than 1800 seconds (30 mins) or very low record count is classified as Brand New (آکبند)
        const condition: 'brand_new' | 'used' = totalActiveTime <= 1800 && totalRecords <= 6 ? 'brand_new' : 'used';

        return {
          totalActiveTime,
          totalRecordCount: totalRecords,
          condition,
          activeTimeFormatted: formatActiveTime(totalActiveTime),
          serialNumber: serial || undefined,
        };
      }
    } catch (err) {
      console.warn('DualSense telemetry reading failed:', err);
    }
    return null;
  }, []);

  // Read PS4 DualShock 4 Hardware Info via WebHID Feature Report 163
  const readPS4HardwareData = useCallback(async (device: any): Promise<PS4HardwareInfo> => {
    let isAuthentic = true;
    let buildDate: string | undefined;
    let buildTime: string | undefined;

    try {
      const rep = await device.receiveFeatureReport(163);
      if (rep && rep.byteLength >= 49 && rep.getInt8(0) === 163) {
        const dec = new TextDecoder('ascii');
        buildDate = dec.decode(new Uint8Array(rep.buffer, 1, 16)).replace(/\0/g, '').trim();
        buildTime = dec.decode(new Uint8Array(rep.buffer, 17, 8)).replace(/\0/g, '').trim();
        isAuthentic = true;
      } else {
        isAuthentic = false;
      }
    } catch {
      // Third-party controllers often reject feature report 163
      isAuthentic = false;
    }

    const isSonyVendor = device.vendorId === 0x054c;
    const rawMfg = device.manufacturerName || '';
    const manufacturer =
      isSonyVendor && (rawMfg.toLowerCase().includes('sony') || !rawMfg)
        ? 'Sony Interactive Entertainment Inc.'
        : rawMfg || 'سازنده متفرقه / شبیه‌ساز (Third-Party)';

    return {
      manufacturer,
      buildDate,
      buildTime,
      isAuthentic: isAuthentic && isSonyVendor,
      vidPid: `0x${device.vendorId.toString(16).padStart(4, '0')} / 0x${device.productId.toString(16).padStart(4, '0')}`,
      modelCode: device.productId === 0x05c4 ? 'CUH-ZCT1 (سری اول)' : 'CUH-ZCT2 (سری دوم اسلیم/پرو)',
    };
  }, []);

  // Handle incoming HID input reports (gyro, accel, buttons)
  const onInputReport = useCallback(
    (event: any) => {
      const { data, reportId } = event;
      if (!data) return;

      const dev = hidDeviceRef.current;
      const isPS5 = dev?.vendorId === 0x054c && (dev?.productId === 0x0ce6 || dev?.productId === 0x0df2);
      const isPS4 = dev?.vendorId === 0x054c && (dev?.productId === 0x05c4 || dev?.productId === 0x09cc);

      if (isPS5) {
        // DualSense: USB reportId=1, BT reportId=0x31
        const offset = reportId === 0x31 ? 1 : 0;
        if (data.byteLength >= 27 + offset) {
          const gyroPitch = data.getInt16(15 + offset, true);
          const gyroYaw = data.getInt16(17 + offset, true);
          const gyroRoll = data.getInt16(19 + offset, true);
          const accelX = data.getInt16(21 + offset, true);
          const accelY = data.getInt16(23 + offset, true);
          const accelZ = data.getInt16(25 + offset, true);

          processIMU({ pitch: gyroPitch, yaw: gyroYaw, roll: gyroRoll }, { x: accelX, y: accelY, z: accelZ });
        }
      } else if (isPS4) {
        // DualShock 4: USB reportId=1
        if (data.byteLength >= 25) {
          const gyroPitch = data.getInt16(13, true);
          const gyroYaw = data.getInt16(15, true);
          const gyroRoll = data.getInt16(17, true);
          const accelX = data.getInt16(19, true);
          const accelY = data.getInt16(21, true);
          const accelZ = data.getInt16(23, true);

          processIMU({ pitch: gyroPitch, yaw: gyroYaw, roll: gyroRoll }, { x: accelX, y: accelY, z: accelZ });
        }
      }
    },
    [processIMU],
  );

  const connectWebHID = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('hid' in navigator)) {
      alert('مرورگر شما از WebHID پشتیبانی نمی‌کند. لطفاً از مرورگر Google Chrome یا Microsoft Edge استفاده کنید.');
      return;
    }

    try {
      const navHid = (navigator as any).hid;
      const devices = await navHid.requestDevice({
        filters: [
          { vendorId: 0x054c, productId: 0x0ce6 }, // DualSense PS5
          { vendorId: 0x054c, productId: 0x0df2 }, // DualSense Edge
          { vendorId: 0x054c, productId: 0x05c4 }, // DualShock 4
          { vendorId: 0x054c, productId: 0x09cc }, // DualShock 4 v2
        ],
      });

      if (!devices || devices.length === 0) return;
      const device = devices[0];

      if (!device.opened) {
        await device.open();
      }

      hidDeviceRef.current = device;
      device.addEventListener('inputreport', onInputReport);

      const isPS5 = device.vendorId === 0x054c && (device.productId === 0x0ce6 || device.productId === 0x0df2);
      const isPS4 = device.vendorId === 0x054c && (device.productId === 0x05c4 || device.productId === 0x09cc);

      if (isPS5) {
        setDeviceType('ps5');
        const telemetry = await readPS5TelemetryData(device);
        if (telemetry) {
          setPs5Info(telemetry);
        } else {
          // Fallback if firmware prevents direct telemetry read
          setPs5Info({
            totalActiveTime: 0,
            totalRecordCount: 1,
            condition: 'brand_new',
            activeTimeFormatted: 'بدون سابقه کارکرد (در حد نو)',
          });
        }
      } else if (isPS4) {
        setDeviceType('ps4');
        const hw = await readPS4HardwareData(device);
        setPs4Info(hw);
      } else {
        setDeviceType('other');
      }

      setIsConnected(true);
      resetOrientation();
      calibrateGyro();
    } catch (err: any) {
      console.error('WebHID connection error:', err);
    }
  }, [onInputReport, readPS5TelemetryData, readPS4HardwareData, resetOrientation, calibrateGyro]);

  const disconnectWebHID = useCallback(() => {
    if (hidDeviceRef.current) {
      try {
        hidDeviceRef.current.removeEventListener('inputreport', onInputReport);
        hidDeviceRef.current.close();
      } catch {
        /* ignore */
      }
      hidDeviceRef.current = null;
    }
    setIsConnected(false);
    setPs5Info(null);
    setPs4Info(null);
  }, [onInputReport]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnectWebHID();
    };
  }, [disconnectWebHID]);

  return {
    isSupported,
    isConnected,
    deviceType,
    orientation,
    gyroRates,
    motionEnergy,
    ps5Info,
    ps4Info,
    connectWebHID,
    disconnectWebHID,
    resetOrientation,
    calibrateGyro,
  };
}
