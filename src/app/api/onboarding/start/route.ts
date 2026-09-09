import { NextResponse } from "next/server";
import { startOnboardingForDealAction, startOnboardingForCustomerAction } from "@/app/onboarding/actions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { dealId, customerId, serviceName, dealValue, templateCode } = body;

    if (dealId) {
      const res = await startOnboardingForDealAction(dealId, templateCode);
      return NextResponse.json(res, { status: res.success ? 200 : 400 });
    }

    if (customerId) {
      const res = await startOnboardingForCustomerAction(customerId, serviceName, dealValue);
      return NextResponse.json(res, { status: res.success ? 200 : 400 });
    }

    return NextResponse.json(
      { success: false, error: "Either dealId or customerId is required" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
