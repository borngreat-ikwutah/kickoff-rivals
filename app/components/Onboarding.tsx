import { useState } from "react";
import { cn } from "../lib/utils";
import { RivalsLogo } from "./RivalsLogo";
import {
  IconChevronRight,
  IconChevronLeft,
  IconCheck,
  IconFootball,
  IconTrophy,
  IconCoins,
  IconUsers,
  IconZap,
} from "./Icons";

interface OnboardingProps {
  onFinish: () => void;
}

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: "Welcome to KickOff Rivals",
    description:
      "The ultimate virtual football betting experience. Place bets, watch live matches, and win big!",
    icon: <IconFootball className="w-16 h-16" />,
    features: [
      "Real-time match simulations",
      "Multiple betting markets",
      "24/7 matches available",
    ],
  },
  {
    id: 2,
    title: "Earn KOR Tokens",
    description:
      "Win bets to earn KOR tokens. Convert your coins to tokens and climb the leaderboards!",
    icon: <IconCoins className="w-16 h-16" />,
    features: [
      "Win bets to earn rewards",
      "Daily quests for bonus coins",
      "Convert coins to KOR tokens",
    ],
  },
  {
    id: 3,
    title: "Join an Alliance",
    description:
      "Pick your favorite team and league. Earn alliance rewards when your team wins!",
    icon: <IconUsers className="w-16 h-16" />,
    features: [
      "Support your favorite team",
      "Earn alliance bonuses",
      "Compete with other alliances",
    ],
  },
  {
    id: 4,
    title: "Complete Quests",
    description:
      "Daily and weekly quests give you bonus coins. Complete them all to maximize your earnings!",
    icon: <IconTrophy className="w-16 h-16" />,
    features: [
      "Daily quest rewards",
      "Weekly challenge bonuses",
      "Social tasks for extra coins",
    ],
  },
  {
    id: 5,
    title: "Ready to Play!",
    description:
      "You're all set! Connect your wallet to start betting and winning. Good luck!",
    icon: <IconZap className="w-16 h-16" />,
    features: [
      "500 welcome coins bonus",
      "Free first-time referral rewards",
      "Instant betting - no delays",
    ],
  },
];

export function Onboarding({ onFinish }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onFinish();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <RivalsLogo size="sm" variant="full" className="text-white" />
        <button
          onClick={handleSkip}
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          Skip
        </button>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentStep
                  ? "w-8 bg-primary"
                  : index < currentStep
                    ? "bg-primary/50"
                    : "bg-slate-600"
              )}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="max-w-md w-full text-center animate-fade-in" key={step.id}>
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-6 rounded-full bg-primary/20 text-primary">
              {step.icon}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {step.title}
          </h1>

          {/* Description */}
          <p className="text-slate-400 mb-8">{step.description}</p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {step.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-3 border border-slate-700"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <IconCheck className="w-4 h-4 text-primary" />
                </div>
                <span className="text-slate-300 text-sm text-left">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4 w-full max-w-md">
          {!isFirstStep && (
            <button
              onClick={handlePrev}
              className="btn btn-ghost h-12 px-6 text-slate-400 hover:text-white"
            >
              <IconChevronLeft className="w-5 h-5 mr-1" />
              Back
            </button>
          )}

          <button
            onClick={handleNext}
            className={cn(
              "btn btn-primary h-12 flex-1 font-semibold",
              "hover:scale-105 transition-transform"
            )}
          >
            {isLastStep ? (
              <>
                Get Started
                <IconZap className="w-5 h-5 ml-2" />
              </>
            ) : (
              <>
                Next
                <IconChevronRight className="w-5 h-5 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-slate-500 text-xs">
        Step {currentStep + 1} of {steps.length}
      </footer>
    </div>
  );
}

export default Onboarding;
