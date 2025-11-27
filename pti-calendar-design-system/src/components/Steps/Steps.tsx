import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';
import { cn } from '../../utils/cn';

export interface Step {
  id: string;
  title: string;
  description?: string;
}

export interface StepsProps {
  steps: Step[];
  currentStep: number;
  onChange?: (step: number) => void;
  orientation?: 'horizontal' | 'vertical';
}

export const Steps: React.FC<StepsProps> = ({
  steps,
  currentStep,
  onChange,
  orientation = 'horizontal',
}) => {
  const isHorizontal = orientation === 'horizontal';

  return (
    <nav aria-label="Progress">
      <ol
        className={cn('flex', {
          'items-center': isHorizontal,
          'flex-col': !isHorizontal,
        })}
      >
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onChange && (isCompleted || index === currentStep + 1);

          return (
            <li
              key={step.id}
              className={cn({
                'flex-1': isHorizontal,
                'pb-10 relative': !isHorizontal && index !== steps.length - 1,
              })}
            >
              {isHorizontal ? (
                <div className="flex items-center">
                  <StepCircle
                    index={index}
                    isCompleted={isCompleted}
                    isCurrent={isCurrent}
                    isClickable={!!isClickable}
                    onClick={() => isClickable && onChange?.(index)}
                  />
                  {index !== steps.length - 1 && (
                    <div
                      className={cn('flex-1 h-0.5 mx-4', {
                        'bg-primary-600': isCompleted,
                        'bg-gray-200': !isCompleted,
                      })}
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-start">
                  <div className="flex flex-col items-center mr-4">
                    <StepCircle
                      index={index}
                      isCompleted={isCompleted}
                      isCurrent={isCurrent}
                      isClickable={!!isClickable}
                      onClick={() => isClickable && onChange?.(index)}
                    />
                    {index !== steps.length - 1 && (
                      <div
                        className={cn('w-0.5 flex-1 mt-2', {
                          'bg-primary-600': isCompleted,
                          'bg-gray-200': !isCompleted,
                        })}
                      />
                    )}
                  </div>
                  <div className="pb-8">
                    <p
                      className={cn('text-sm font-medium', {
                        'text-primary-600': isCurrent,
                        'text-gray-900': isCompleted,
                        'text-gray-500': !isCompleted && !isCurrent,
                      })}
                    >
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                    )}
                  </div>
                </div>
              )}
              {isHorizontal && (
                <p
                  className={cn('text-sm font-medium mt-2 text-center', {
                    'text-primary-600': isCurrent,
                    'text-gray-900': isCompleted,
                    'text-gray-500': !isCompleted && !isCurrent,
                  })}
                >
                  {step.title}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

interface StepCircleProps {
  index: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isClickable: boolean;
  onClick: () => void;
}

const StepCircle: React.FC<StepCircleProps> = ({
  index,
  isCompleted,
  isCurrent,
  isClickable,
  onClick,
}) => {
  const baseClasses = 'flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm transition-colors';

  if (isCompleted) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!isClickable}
        className={cn(baseClasses, 'bg-primary-600 text-white', {
          'cursor-pointer hover:bg-primary-700': isClickable,
        })}
      >
        <CheckIcon className="h-5 w-5" />
      </button>
    );
  }

  if (isCurrent) {
    return (
      <span
        className={cn(baseClasses, 'border-2 border-primary-600 text-primary-600 bg-white')}
      >
        {index + 1}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={cn(baseClasses, 'border-2 border-gray-300 text-gray-500 bg-white', {
        'cursor-pointer hover:border-gray-400': isClickable,
      })}
    >
      {index + 1}
    </button>
  );
};
