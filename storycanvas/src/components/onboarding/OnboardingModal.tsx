'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, MousePointer, Hand, Type, Save, Trash2 } from 'lucide-react'

interface OnboardingStep {
  title: string
  description: string
  icon: React.ReactNode
}

const steps: OnboardingStep[] = [
  {
    title: 'Welcome to Bibliarch!',
    description: 'Create immersive, interactive stories with our visual development tool. Let\'s get you started on your storytelling journey.',
    icon: <Sparkles className="w-12 h-12 text-purple-600" />
  },
  {
    title: 'Creating Story Nodes',
    description: 'Click the Text tool or press "T" to add story nodes to your canvas. Each node represents a scene, character, or plot point in your story.',
    icon: <Type className="w-12 h-12 text-blue-600" />
  },
  {
    title: 'Navigate Your Canvas',
    description: 'Use the Pan tool or hold Space to move around. Scroll to zoom in and out. Your canvas is infinite - let your imagination run wild!',
    icon: <Hand className="w-12 h-12 text-green-600" />
  },
  {
    title: 'Edit and Organize',
    description: 'Double-click nodes to edit text. Press Delete to remove selected nodes. Drag nodes around to organize your story flow.',
    icon: <MousePointer className="w-12 h-12 text-orange-600" />
  },
  {
    title: 'Save Your Work',
    description: 'Your story auto-saves, but you can also manually save with the Save button. Your stories are stored securely in the cloud.',
    icon: <Save className="w-12 h-12 text-purple-600" />
  }
]

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
    if (!hasSeenOnboarding) {
      setIsOpen(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true')
    setIsOpen(false)
  }

  const handleSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true')
    setIsOpen(false)
  }

  const step = steps[currentStep]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            {step.icon}
          </div>
          <DialogTitle className="text-center text-xl">
            {step.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-center text-muted-foreground">
            {step.description}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 py-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentStep 
                  ? 'bg-purple-600' 
                  : index < currentStep 
                    ? 'bg-purple-300'
                    : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="sm:mr-auto"
          >
            Skip Tour
          </Button>
          
          <div className="flex gap-2 w-full sm:w-auto">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="flex-1 sm:flex-initial"
              >
                Previous
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}