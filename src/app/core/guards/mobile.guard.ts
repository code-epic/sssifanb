import { inject } from "@angular/core";
import { CanMatchFn, Route, UrlSegment } from "@angular/router";
import { MobileDetectionService } from "../services/mobile-detection/mobile-detection.service";

export const isMobileGuard: CanMatchFn = (route: Route, segments: UrlSegment[]) => {
  const mobileService = inject(MobileDetectionService);
  return mobileService.isMobile;
};

export const isDesktopGuard: CanMatchFn = (route: Route, segments: UrlSegment[]) => {
  const mobileService = inject(MobileDetectionService);
  return !mobileService.isMobile;
};
