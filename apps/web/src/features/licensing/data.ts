import { prisma } from "@rallly/database";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { INSTANCE_LICENSE_TAG } from "@/features/licensing/constants";
import { isSelfHosted } from "@/utils/constants";

export function getInstanceLicense() {
  return prisma.instanceLicense.findFirst({
    orderBy: {
      id: "asc",
    },
  });
}

export const cached_getInstanceLicense = unstable_cache(
  getInstanceLicense,
  [],
  {
    tags: [INSTANCE_LICENSE_TAG],
  },
);

export const loadInstanceLicense = cache(async () => {
  if (!isSelfHosted) {
    return null;
  }

  const license = await cached_getInstanceLicense();

  if (!license) {
    return null;
  }

  return {
    licenseKey: license.licenseKey,
    licenseeName: license.licenseeName,
    licenseeEmail: license.licenseeEmail,
    issuedAt: license.issuedAt,
    expiresAt: license.expiresAt,
    seats:
      license.seats ??
      (license.type === "ENTERPRISE" ? Number.POSITIVE_INFINITY : 1),
    type: license.type,
    whiteLabelAddon: license.whiteLabelAddon,
  };
});

/**
 * Modified: Always return unlimited users for self-hosted instances
 */
export const getUserLimit = async () => {
  return Number.POSITIVE_INFINITY;
};

export const getWhiteLabelAddon = async () => {
  const license = await loadInstanceLicense();
  return license?.whiteLabelAddon ?? false;
};
