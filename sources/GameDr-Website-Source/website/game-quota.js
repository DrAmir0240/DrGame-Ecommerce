'use strict';

const BYTES_PER_GB = 1024 ** 3;

function quotaBytesForGB(gigabytes) {
  const gb = Number(gigabytes);
  return Number.isFinite(gb) && gb > 0 ? Math.round(gb * BYTES_PER_GB) : 0;
}

function gameQuotaGB(sizeBytes) {
  const bytes = Number(sizeBytes);
  return Number.isFinite(bytes) && bytes > 0
    ? Math.round((bytes / BYTES_PER_GB) * 100) / 100
    : null;
}

module.exports = { BYTES_PER_GB, quotaBytesForGB, gameQuotaGB };
