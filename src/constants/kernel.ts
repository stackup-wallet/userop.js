export type KernelSupportedVersions = "v2.3";
export interface KernelAddressMap {
  Factory: string;
  ECDSAValidator: string;
  Implementation: string;
}
export type KernelVersionToAddressMap = Record<
  KernelSupportedVersions,
  KernelAddressMap
>;
export type KernelModes = {
  Sudo: "0x00000000";
  Plugin: "0x00000001";
  Enable: "0x00000002";
};

export interface KernelConst {
  latestVersion: KernelSupportedVersions;
  versions: KernelVersionToAddressMap;
  Modes: KernelModes;
}

export const Kernel: KernelConst = {
  latestVersion: "v2.3",
  versions: {
    "v2.3": {
      Factory: "0x5de4839a76cf55d0c90e2061ef4386d962E15ae3",
      ECDSAValidator: "0xd9AB5096a832b9ce79914329DAEE236f8Eea0390",
      Implementation: "0xD3F582F6B4814E989Ee8E96bc3175320B5A540ab",
    },
  },
  Modes: {
    Sudo: "0x00000000",
    Plugin: "0x00000001",
    Enable: "0x00000002",
  },
};
