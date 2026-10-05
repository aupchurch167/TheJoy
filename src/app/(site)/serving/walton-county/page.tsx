import CountyLanding, { countyMetadata } from "@/components/landing/CountyLanding";

export const metadata = countyMetadata("walton-county");

export default function Page() {
  return <CountyLanding slug="walton-county" />;
}
