import React, { useState } from "react";
import { AppHeader } from "../../components/navigation/AppHeader.jsx";
import { Stepper } from "../../components/navigation/Stepper.jsx";
import { ToggleSwitch } from "../../components/actions/ToggleSwitch.jsx";
import { LoadingBanner } from "../../components/feedback/LoadingBanner.jsx";
import { Notice } from "../../components/feedback/Notice.jsx";
import { BriefStep } from "./BriefStep.jsx";
import { UploadStep } from "./UploadStep.jsx";
import { ProfileStep } from "./ProfileStep.jsx";
import { RecommendStep } from "./RecommendStep.jsx";
import { ValidateStep } from "./ValidateStep.jsx";
import { DashboardScreen } from "./DashboardScreen.jsx";
import { ExportStep } from "./ExportStep.jsx";
import { STEPS, AI_OFF_WARNING, ANIMATE } from "./KitData.jsx";

/**
 * Interactive recreation of the Dashboard Copilot workflow app.
 */
export function WorkflowApp() {
  const [step, setStep] = useState(0);
  const [maxVisited, setMaxVisited] = useState(0);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [samplesLoaded, setSamplesLoaded] = useState(false);
  const [working, setWorking] = useState(false);

  function goTo(index) {
    setStep(index);
    setMaxVisited((current) => Math.max(current, index));
  }

  function advanceWithDelay(index) {
    setWorking(true);
    window.setTimeout(() => {
      setWorking(false);
      goTo(index);
    }, 700);
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <AppHeader links={[{ label: "About", href: "#" }]} loading={working}>
        <div style={{ alignItems: "center", display: "flex", justifyContent: "flex-end", minHeight: "26px", width: "96px" }}>
          {working && <LoadingBanner />}
        </div>
        <ToggleSwitch label="AI" checked={aiEnabled} onChange={setAiEnabled} />
      </AppHeader>
      <div style={{ margin: "0 auto", maxWidth: "1240px", padding: "26px 28px 56px" }}>
        <div style={{ marginBottom: "18px" }}>
          <Stepper
            steps={STEPS}
            currentIndex={step}
            onNavigate={goTo}
            canNavigateTo={(index) => index <= maxVisited}
          />
        </div>
        {!aiEnabled && <Notice tone="warn" items={[AI_OFF_WARNING]} style={{ margin: "0 0 18px" }} />}
        <div
          style={{
            background: "rgba(255,255,255,0.86)",
            border: "1px solid var(--line)",
            borderRadius: "8px",
            boxShadow: "var(--shadow)",
            padding: "28px",
            animation: ANIMATE ? "dcPanelIn 260ms var(--ease)" : "none",
          }}
        >
          {step === 0 && <BriefStep onContinue={() => goTo(1)} />}
          {step === 1 && (
            <UploadStep loaded={samplesLoaded} onLoadSamples={() => setSamplesLoaded(true)} onProfile={() => goTo(2)} />
          )}
          {step === 2 && <ProfileStep working={working} onRecommend={() => advanceWithDelay(3)} />}
          {step === 3 && <RecommendStep onAccept={() => goTo(4)} />}
          {step === 4 && <ValidateStep working={working} onProceed={() => advanceWithDelay(5)} />}
          {step === 5 && <DashboardScreen onExport={() => goTo(6)} />}
          {step === 6 && <ExportStep />}
        </div>
      </div>
    </div>
  );
}
