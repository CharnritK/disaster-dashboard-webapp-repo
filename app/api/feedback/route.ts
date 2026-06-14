import { NextResponse } from "next/server";

import { getRequestAuthContext } from "@/lib/auth/requestAuth";
import {
  FeedbackValidationError,
  parseFeedbackSubmission,
  saveFeedback,
} from "@/lib/feedback";

export async function POST(request: Request) {
  const auth = await getRequestAuthContext(request);
  if (!auth) {
    return jsonNoStore(
      {
        error: "Sign in to submit feedback.",
        fallbackReason: "unauthenticated",
      },
      { status: 401 },
    );
  }

  try {
    const submission = parseFeedbackSubmission(await request.json());
    const saved = await saveFeedback(auth.userId, submission);
    return jsonNoStore({
      id: saved.id,
      ok: true,
    });
  } catch (error) {
    if (error instanceof FeedbackValidationError) {
      return jsonNoStore(
        {
          error: error.message,
        },
        { status: 400 },
      );
    }

    return jsonNoStore(
      {
        error: "Feedback could not be saved.",
      },
      { status: 500 },
    );
  }
}

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
