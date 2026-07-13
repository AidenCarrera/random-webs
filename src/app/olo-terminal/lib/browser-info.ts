import type { NavigatorWithDeviceInfo } from "../types";

export function getBrowserMemory(): string {
  if (typeof navigator !== "undefined") {
    const memory = (navigator as NavigatorWithDeviceInfo).deviceMemory ?? 16;
    return `${memory * 1024}MB RAM`;
  }

  return "16384MB RAM";
}

export function getVirtualCPU(): string {
  if (typeof navigator !== "undefined") {
    const cores = navigator.hardwareConcurrency || 8;
    return `OloCore Virtual CPU (${cores} threads)`;
  }

  return "OloCore Virtual CPU (8 threads)";
}
