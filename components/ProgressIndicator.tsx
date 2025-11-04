import React from 'react';

interface ProgressIndicatorProps {
  currentStep: number; // 1, 2, or 3
}

const Step: React.FC<{ step: number; label: string; isActive: boolean; isComplete: boolean; }> = ({ step, label, isActive, isComplete }) => {
    const baseClasses = "w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors";
    const activeClasses = "bg-brand-blue text-white";
    const completeClasses = "bg-green-500 text-white";
    const inactiveClasses = "bg-gray-200 text-gray-500";
    
    const getClasses = () => {
        if (isComplete) return completeClasses;
        if (isActive) return activeClasses;
        return inactiveClasses;
    }

    return (
        <div className="flex flex-col items-center">
            <div className={`${baseClasses} ${getClasses()}`}>
                {isComplete ? '✔' : step}
            </div>
            <p className={`mt-2 text-xs font-semibold ${isActive || isComplete ? 'text-brand-dark' : 'text-gray-400'}`}>{label}</p>
        </div>
    );
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep }) => {
    const steps = [
        { number: 1, label: "Account" },
        { number: 2, label: "Verify" },
        { number: 3, label: "ID" }
    ];

    return (
        <div className="flex justify-between items-start w-full px-4">
            {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                    <Step 
                        step={step.number} 
                        label={step.label}
                        isActive={currentStep === step.number}
                        isComplete={currentStep > step.number}
                    />
                    {index < steps.length - 1 && (
                        <div className={`flex-1 h-1 mt-4 ${currentStep > (index + 1) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
