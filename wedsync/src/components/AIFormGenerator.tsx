'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sparkles,
  Wand2,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Edit3,
  Save
} from 'lucide-react';

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  description?: string;
  required: boolean;
  validation: Record<string, any>;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
  gridColumn: number;
  order: number;
}

interface GeneratedForm {
  name: string;
  description: string;
  fields: FormField[];
  reasoning: string;
  confidence: number;
}

interface AIFormGeneratorProps {
  onFormGenerated?: (form: GeneratedForm) => void;
  onUseForm?: (form: GeneratedForm) => void;
  supplierSpecialization?: string;
}

const PROMPT_TEMPLATES = {
  photographer: "Create a client intake form for wedding photography including timeline preferences, must-have shots, style preferences, and contact information",
  dj: "Generate a wedding DJ planning form covering music preferences, special songs, announcements, timeline, and equipment needs",
  florist: "Build a floral consultation form including color preferences, flower types, allergies, budget, and delivery details",
  caterer: "Create a catering questionnaire covering dietary restrictions, guest count, menu preferences, service style, and special requirements",
  venue: "Generate a venue booking form including date preferences, guest count, layout requirements, catering needs, and special accommodations",
  planner: "Build a comprehensive wedding planning form covering vision, budget, priorities, timeline, vendor preferences, and logistics",
  other: "Create a wedding vendor intake form including client needs, preferences, timeline, budget, and specific requirements"
};

const EXAMPLE_PROMPTS = [
  "Create a wedding photography questionnaire that captures the couple's vision, timeline, and must-have shots",
  "Generate a catering form for dietary restrictions, guest count, and menu preferences",
  "Build a venue booking form with availability, capacity, and setup requirements",
  "Create a DJ form for music preferences, special songs, and reception timeline",
  "Generate a floral consultation form covering style, colors, and delivery details",
  "Build a wedding planning intake form for budget, vision, and vendor coordination"
];

export default function AIFormGenerator({ 
  onFormGenerated, 
  onUseForm, 
  supplierSpecialization = 'other' 
}: AIFormGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedForm, setGeneratedForm] = useState<GeneratedForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'preview' | 'editing'>('input');

  const generateForm = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a description of the form you want to create');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate AI generation - in real implementation, this would call an AI service
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockGeneratedForm: GeneratedForm = {
        name: "AI Generated Form",
        description: "Form created based on your requirements",
        fields: [
          {
            id: "field_1",
            type: "text",
            label: "Full Name",
            placeholder: "Enter your full name",
            description: "Please provide the full name for the primary contact",
            required: true,
            validation: { minLength: 2 },
            gridColumn: 1,
            order: 0
          },
          {
            id: "field_2", 
            type: "email",
            label: "Email Address",
            placeholder: "your@email.com",
            description: "We'll use this to send you updates and confirmations",
            required: true,
            validation: {},
            gridColumn: 1,
            order: 1
          },
          {
            id: "field_3",
            type: "phone",
            label: "Phone Number",
            placeholder: "+1 (555) 123-4567",
            description: "Best number to reach you",
            required: true,
            validation: {},
            gridColumn: 1,
            order: 2
          },
          {
            id: "field_4",
            type: "date",
            label: "Wedding Date",
            description: "When is your special day?",
            required: true,
            validation: {},
            gridColumn: 1,
            order: 3
          },
          {
            id: "field_5",
            type: "select",
            label: "Budget Range",
            description: "Please select your budget range",
            required: true,
            validation: {},
            options: [
              { value: "under_5k", label: "Under $5,000" },
              { value: "5k_10k", label: "$5,000 - $10,000" },
              { value: "10k_20k", label: "$10,000 - $20,000" },
              { value: "over_20k", label: "Over $20,000" }
            ],
            gridColumn: 1,
            order: 4
          },
          {
            id: "field_6",
            type: "textarea",
            label: "Special Requirements",
            placeholder: "Please describe any special requirements or preferences...",
            description: "Tell us about any specific needs, preferences, or requirements",
            required: false,
            validation: {},
            gridColumn: 1,
            order: 5
          }
        ],
        reasoning: "This form captures essential client information including contact details, wedding date, budget considerations, and specific requirements. The fields are ordered logically from basic contact info to more detailed preferences.",
        confidence: 92
      };

      setGeneratedForm(mockGeneratedForm);
      setStep('preview');
      
      if (onFormGenerated) {
        onFormGenerated(mockGeneratedForm);
      }
    } catch (err) {
      setError('Failed to generate form. Please try again.');
      console.error('Form generation error:', err);
    } finally {
      setLoading(false);
    }
  }, [prompt, onFormGenerated]);

  const useTemplate = useCallback((template: string) => {
    setPrompt(template);
  }, []);

  const regenerateForm = useCallback(() => {
    generateForm();
  }, [generateForm]);

  const editForm = useCallback(() => {
    setStep('editing');
  }, []);

  const saveAndUse = useCallback(() => {
    if (generatedForm && onUseForm) {
      onUseForm(generatedForm);
    }
  }, [generatedForm, onUseForm]);

  const renderInputStep = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Sparkles className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Form Generator</h2>
        <p className="text-gray-600">
          Describe the form you need and let AI create it for you instantly
        </p>
      </div>

      {/* Quick Templates */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Quick Start Templates
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {EXAMPLE_PROMPTS.map((template, index) => (
            <Button
              key={index}
              variant="outline"
              className="text-left h-auto p-3 justify-start"
              onClick={() => useTemplate(template)}
            >
              <FileText className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm">{template}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Prompt */}
      <div>
        <Label htmlFor="ai-prompt" className="text-sm font-medium text-gray-700 mb-2 block">
          Describe Your Form
        </Label>
        <Textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Example: ${PROMPT_TEMPLATES[supplierSpecialization as keyof typeof PROMPT_TEMPLATES]}`}
          rows={4}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Be specific about the information you need to collect and any special requirements
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Generate Button */}
      <Button
        onClick={generateForm}
        disabled={loading || !prompt.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating Form...
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4 mr-2" />
            Generate Form with AI
          </>
        )}
      </Button>
    </div>
  );

  const renderPreviewStep = () => {
    if (!generatedForm) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Generated Form Preview</h2>
            <p className="text-gray-600">Review and customize your AI-generated form</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              {generatedForm.confidence}% Confidence
            </Badge>
          </div>
        </div>

        {/* AI Reasoning */}
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <strong>AI Reasoning:</strong> {generatedForm.reasoning}
          </AlertDescription>
        </Alert>

        {/* Form Preview */}
        <Card>
          <CardHeader>
            <CardTitle>{generatedForm.name}</CardTitle>
            {generatedForm.description && (
              <p className="text-gray-600">{generatedForm.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedForm.fields.map((field, index) => (
              <div key={field.id} className="p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <Label className="font-medium">{field.label}</Label>
                  {field.required && (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">{field.type}</Badge>
                </div>
                
                {field.description && (
                  <p className="text-sm text-gray-600 mb-2">{field.description}</p>
                )}

                <div className="text-xs text-gray-500">
                  {field.placeholder && `Placeholder: "${field.placeholder}"`}
                  {field.options && ` • ${field.options.length} options`}
                  {field.validation && Object.keys(field.validation).length > 0 && 
                    ` • Validation rules applied`}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={regenerateForm} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          <Button onClick={editForm} variant="outline">
            <Edit3 className="h-4 w-4 mr-2" />
            Customize
          </Button>
          <Button onClick={saveAndUse} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" />
            Use This Form
          </Button>
        </div>

        {/* Back to Input */}
        <Button 
          variant="ghost" 
          onClick={() => setStep('input')}
          className="w-full"
        >
          ← Start Over
        </Button>
      </div>
    );
  };

  const renderEditingStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Customize Your Form</h2>
        <p className="text-gray-600">
          Form customization will be available in the full form builder
        </p>
      </div>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This feature will redirect to the main form builder where you can make detailed customizations.
        </AlertDescription>
      </Alert>

      <div className="flex gap-3">
        <Button onClick={() => setStep('preview')} variant="outline">
          ← Back to Preview
        </Button>
        <Button onClick={saveAndUse} className="bg-green-600 hover:bg-green-700">
          <Save className="h-4 w-4 mr-2" />
          Use Form As-Is
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardContent className="p-8">
          {step === 'input' && renderInputStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'editing' && renderEditingStep()}
        </CardContent>
      </Card>
    </div>
  );
}