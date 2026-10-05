import CountyLanding, { countyMetadata } from "@/components/landing/CountyLanding";

export const metadata = countyMetadata("gwinnett-county");

export default function Page() {
  return <CountyLanding slug="gwinnett-county" />;
}
