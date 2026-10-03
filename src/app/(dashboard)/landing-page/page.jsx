"use client";


import { BentoImageGallery } from "@/components/LandingPage/BentoImageGallery";
import MidBannerSection from "@/components/LandingPage/MidBanner";


const page = () => {
  return (
    <div className="space-y-16">
      {/* <PromoSection /> */}
      <BentoImageGallery />
      <MidBannerSection />
      {/* <TopPickSeason /> */}

    </div>
  );
};

export default page;