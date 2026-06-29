import { NextResponse } from "next/server";

import { readJsonRequest } from "@/lib/apiSecurity";
import { getRequestAuthContext } from "@/lib/auth/requestAuth";
import {
  FeedbackValidationError,
  parseFeedbackSubmission,
  saveFeedback,
} from "@/lib/feedback";

const FEEDBACK_REQUEST_MAX_BYTES = 12_000;

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
    const bodyResult = await readJsonRequest(request, FEEDBACK_REQUEST_MAX_BYTES);
    if (!bodyResult.ok) {
      return jsonNoStore({ error: bodyResult.error }, { status: bodyResult.status });
    }
    const submission = parseFeedbackSubmission(bodyResult.body);
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
