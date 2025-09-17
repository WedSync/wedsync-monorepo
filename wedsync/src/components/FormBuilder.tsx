'use client';

import { useState, useRef, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Grip,
  Edit3,
  Trash2,
  Copy,
  Eye,
  Settings,
  Palette,
  Save,
  Play,
  Type,
  Mail,
  Phone,
  Calendar,
  CheckSquare,
  RadioButton,
  List,
  Upload,
  MapPin,
  Star,
  Hash,
  Clock
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

interface FormBuilderProps {
  formId?: string;
  initialForm?: {
    name: string;
    description?: string;
    fields: FormField[];
    branding?: Record<string, any>;
    settings?: Record<string, any>;
  };
  onSave?: (formData: any) => void;
  onPreview?: (formData: any) => void;
}

const FIELD_TYPES = [
  { type: 'text', label: 'Text Input', icon: Type, description: 'Single line text' },
  { type: 'textarea', label: 'Text Area', icon: Type, description: 'Multi-line text' },
  { type: 'email', label: 'Email', icon: Mail, description: 'Email address' },
  { type: 'phone', label: 'Phone', icon: Phone, description: 'Phone number' },
  { type: 'number', label: 'Number', icon: Hash, description: 'Numeric input' },
  { type: 'date', label: 'Date', icon: Calendar, description: 'Date picker' },
  { type: 'time', label: 'Time', icon: Clock, description: 'Time picker' },
  { type: 'select', label: 'Dropdown', icon: List, description: 'Select one option' },
  { type: 'radio', label: 'Radio Buttons', icon: RadioButton, description: 'Choose one option' },
  { type: 'checkbox', label: 'Checkboxes', icon: CheckSquare, description: 'Multiple selections' },
  { type: 'file', label: 'File Upload', icon: Upload, description: 'Upload files' },
  { type: 'address', label: 'Address', icon: MapPin, description: 'Address input' },
  { type: 'rating', label: 'Star Rating', icon: Star, description: 'Rating scale' }
];

export default function FormBuilder({ formId, initialForm, onSave, onPreview }: FormBuilderProps) {
  const [formName, setFormName] = useState(initialForm?.name || 'Untitled Form');
  const [formDescription, setFormDescription] = useState(initialForm?.description || '');
  const [fields, setFields] = useState<FormField[]>(initialForm?.fields || []);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('design');
  const [saving, setSaving] = useState(false);
  const [branding, setBranding] = useState(initialForm?.branding || {
    primaryColor: '#3B82F6',
    fontFamily: 'Inter',
    logo: null
  });
  const [settings, setSettings] = useState(initialForm?.settings || {
    multiPage: false,
    progressBar: true,
    saveProgress: true,
    submitButtonText: 'Submit',
    thankYouMessage: 'Thank you for your submission!',
    emailNotifications: true
  });

  const fieldIdCounter = useRef(fields.length);

  const generateFieldId = useCallback(() => {
    fieldIdCounter.current += 1;
    return `field_${fieldIdCounter.current}_${Date.now()}`;
  }, []);

  const addField = useCallback((fieldType: string) => {
    const typeConfig = FIELD_TYPES.find(t => t.type === fieldType);
    if (!typeConfig) return;

    const newField: FormField = {
      id: generateFieldId(),
      type: fieldType,
      label: typeConfig.label,
      placeholder: '',
      description: '',
      required: false,
      validation: {},
      options: ['select', 'radio', 'checkbox'].includes(fieldType) ? [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' }
      ] : undefined,
      gridColumn: 1,
      order: fields.length
    };

    setFields(prev => [...prev, newField]);
    setSelectedField(newField.id);
  }, [fields.length, generateFieldId]);

  const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  }, []);

  const removeField = useCallback((fieldId: string) => {
    setFields(prev => prev.filter(field => field.id !== fieldId));
    if (selectedField === fieldId) {
      setSelectedField(null);
    }
  }, [selectedField]);

  const duplicateField = useCallback((fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    const duplicatedField: FormField = {
      ...field,
      id: generateFieldId(),
      label: `${field.label} (Copy)`,
      order: fields.length
    };

    setFields(prev => [...prev, duplicatedField]);
  }, [fields, generateFieldId]);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setFields(updatedItems);
  }, [fields]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const formData = {
        name: formName,
        description: formDescription,
        fields,
        branding,
        settings,
        version: 1,
        status: 'draft'
      };

      if (onSave) {
        await onSave(formData);
      }
    } catch (error) {
      console.error('Error saving form:', error);
    } finally {
      setSaving(false);
    }
  }, [formName, formDescription, fields, branding, settings, onSave]);

  const handlePreview = useCallback(() => {
    const formData = {
      name: formName,
      description: formDescription,
      fields,
      branding,
      settings
    };

    if (onPreview) {
      onPreview(formData);
    }
  }, [formName, formDescription, fields, branding, settings, onPreview]);

  const renderFieldPreview = (field: FormField) => {
    const isSelected = selectedField === field.id;
    
    return (
      <div
        key={field.id}
        className={`group relative p-3 border-2 rounded-lg cursor-pointer transition-all ${
          isSelected 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setSelectedField(field.id)}
      >
        {/* Field actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              duplicateField(field.id);
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              removeField(field.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Drag handle */}
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Grip className="h-4 w-4 text-gray-400" />
        </div>

        {/* Field content */}
        <div className="ml-6 mr-16">
          <div className="flex items-center gap-2 mb-2">
            <Label className="font-medium">{field.label}</Label>
            {field.required && (
              <Badge variant="destructive" className="text-xs">Required</Badge>
            )}
          </div>
          
          {field.description && (
            <p className="text-sm text-gray-600 mb-2">{field.description}</p>
          )}

          {/* Field preview based on type */}
          <div className="pointer-events-none">
            {field.type === 'text' && (
              <Input placeholder={field.placeholder || 'Enter text...'} />
            )}
            {field.type === 'textarea' && (
              <Textarea placeholder={field.placeholder || 'Enter text...'} rows={3} />
            )}
            {field.type === 'email' && (
              <Input type="email" placeholder={field.placeholder || 'Enter email...'} />
            )}
            {field.type === 'phone' && (
              <Input type="tel" placeholder={field.placeholder || 'Enter phone...'} />
            )}
            {field.type === 'number' && (
              <Input type="number" placeholder={field.placeholder || 'Enter number...'} />
            )}
            {field.type === 'date' && (
              <Input type="date" />
            )}
            {field.type === 'select' && (
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an option..." />
                </SelectTrigger>
              </Select>
            )}
            {field.type === 'radio' && field.options && (
              <div className="space-y-2">
                {field.options.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input type="radio" name={field.id} className="w-4 h-4" />
                    <Label className="text-sm">{option.label}</Label>
                  </div>
                ))}
              </div>
            )}
            {field.type === 'checkbox' && field.options && (
              <div className="space-y-2">
                {field.options.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <Label className="text-sm">{option.label}</Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFieldEditor = () => {
    const field = fields.find(f => f.id === selectedField);
    if (!field) {
      return (
        <div className="p-6 text-center text-gray-500">
          <Edit3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Select a field to edit its properties</p>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Field Properties</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="field-label">Label</Label>
              <Input
                id="field-label"
                value={field.label}
                onChange={(e) => updateField(field.id, { label: e.target.value })}
                placeholder="Field label"
              />
            </div>

            <div>
              <Label htmlFor="field-placeholder">Placeholder</Label>
              <Input
                id="field-placeholder"
                value={field.placeholder || ''}
                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                placeholder="Placeholder text"
              />
            </div>

            <div>
              <Label htmlFor="field-description">Description</Label>
              <Textarea
                id="field-description"
                value={field.description || ''}
                onChange={(e) => updateField(field.id, { description: e.target.value })}
                placeholder="Help text for this field"
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="field-required"
                checked={field.required}
                onCheckedChange={(checked) => updateField(field.id, { required: checked })}
              />
              <Label htmlFor="field-required">Required field</Label>
            </div>

            {/* Options for select, radio, checkbox fields */}
            {['select', 'radio', 'checkbox'].includes(field.type) && (
              <div>
                <Label>Options</Label>
                <div className="space-y-2 mt-2">
                  {field.options?.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option.label}
                        onChange={(e) => {
                          const newOptions = [...(field.options || [])];
                          newOptions[index] = { ...option, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') };
                          updateField(field.id, { options: newOptions });
                        }}
                        placeholder={`Option ${index + 1}`}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newOptions = field.options?.filter((_, i) => i !== index);
                          updateField(field.id, { options: newOptions });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newOptions = [...(field.options || [])];
                      newOptions.push({ value: `option_${newOptions.length + 1}`, label: `Option ${newOptions.length + 1}` });
                      updateField(field.id, { options: newOptions });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>
            )}

            {/* Validation settings */}
            <div>
              <Label>Validation</Label>
              <div className="space-y-2 mt-2">
                {field.type === 'text' && (
                  <>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">Min Length</Label>
                        <Input
                          type="number"
                          value={field.validation.minLength || ''}
                          onChange={(e) => updateField(field.id, {
                            validation: { ...field.validation, minLength: parseInt(e.target.value) || undefined }
                          })}
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Max Length</Label>
                        <Input
                          type="number"
                          value={field.validation.maxLength || ''}
                          onChange={(e) => updateField(field.id, {
                            validation: { ...field.validation, maxLength: parseInt(e.target.value) || undefined }
                          })}
                        />
                      </div>
                    </div>
                  </>
                )}
                {field.type === 'number' && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Min Value</Label>
                      <Input
                        type="number"
                        value={field.validation.min || ''}
                        onChange={(e) => updateField(field.id, {
                          validation: { ...field.validation, min: parseFloat(e.target.value) || undefined }
                        })}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Max Value</Label>
                      <Input
                        type="number"
                        value={field.validation.max || ''}
                        onChange={(e) => updateField(field.id, {
                          validation: { ...field.validation, max: parseFloat(e.target.value) || undefined }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="text-lg font-semibold border-none p-0 h-auto"
                placeholder="Form Name"
              />
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="text-sm text-gray-600 border-none p-0 h-auto mt-1"
                placeholder="Form description..."
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Play className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Left sidebar - Field palette */}
        <div className="w-64 bg-white border-r">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="design" className="p-4">
              <div>
                <h3 className="font-semibold mb-3">Add Fields</h3>
                <div className="space-y-2">
                  {FIELD_TYPES.map((fieldType) => {
                    const Icon = fieldType.icon;
                    return (
                      <Button
                        key={fieldType.type}
                        variant="outline"
                        className="w-full justify-start h-auto p-3"
                        onClick={() => addField(fieldType.type)}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium text-sm">{fieldType.label}</div>
                          <div className="text-xs text-gray-500">{fieldType.description}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="style" className="p-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Form Styling</h3>
                
                <div>
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <Input
                    id="primary-color"
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="font-family">Font Family</Label>
                  <Select
                    value={branding.fontFamily}
                    onValueChange={(value) => setBranding(prev => ({ ...prev, fontFamily: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="p-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Form Settings</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="multi-page">Multi-page form</Label>
                    <Switch
                      id="multi-page"
                      checked={settings.multiPage}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, multiPage: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="progress-bar">Progress bar</Label>
                    <Switch
                      id="progress-bar"
                      checked={settings.progressBar}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, progressBar: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="save-progress">Save progress</Label>
                    <Switch
                      id="save-progress"
                      checked={settings.saveProgress}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, saveProgress: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications">Email notifications</Label>
                    <Switch
                      id="email-notifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="submit-button-text">Submit Button Text</Label>
                  <Input
                    id="submit-button-text"
                    value={settings.submitButtonText}
                    onChange={(e) => setSettings(prev => ({ ...prev, submitButtonText: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="thank-you-message">Thank You Message</Label>
                  <Textarea
                    id="thank-you-message"
                    value={settings.thankYouMessage}
                    onChange={(e) => setSettings(prev => ({ ...prev, thankYouMessage: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center - Form canvas */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>{formName}</CardTitle>
                {formDescription && (
                  <p className="text-gray-600">{formDescription}</p>
                )}
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Plus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Start building your form by adding fields from the left panel</p>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="form-fields">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-4"
                        >
                          {fields
                            .sort((a, b) => a.order - b.order)
                            .map((field, index) => (
                              <Draggable key={field.id} draggableId={field.id} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    {renderFieldPreview(field)}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right sidebar - Field properties */}
        <div className="w-80 bg-white border-l">
          {renderFieldEditor()}
        </div>
      </div>
    </div>
  );
}