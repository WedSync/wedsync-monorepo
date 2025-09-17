import * as React from "react"
import { cn } from "../lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { 
  PlusIcon, 
  GripVerticalIcon,
  TrashIcon,
  TypeIcon,
  AlignLeftIcon,
  ListIcon,
  RadioIcon,
  CheckSquareIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  HashIcon
} from "lucide-react"
import type { FormField, FieldType } from '@wedsync/types'

interface FormBuilderProps {
  fields: FormField[]
  onFieldsChange: (fields: FormField[]) => void
  onPreview?: () => void
  editable?: boolean
  className?: string
}

const fieldTypeConfig: Record<FieldType, { icon: React.ElementType; label: string; hasOptions: boolean }> = {
  text: { icon: TypeIcon, label: "Text Input", hasOptions: false },
  textarea: { icon: AlignLeftIcon, label: "Text Area", hasOptions: false },
  select: { icon: ListIcon, label: "Dropdown", hasOptions: true },
  radio: { icon: RadioIcon, label: "Radio Buttons", hasOptions: true },
  checkbox: { icon: CheckSquareIcon, label: "Checkboxes", hasOptions: true },
  email: { icon: MailIcon, label: "Email", hasOptions: false },
  phone: { icon: PhoneIcon, label: "Phone", hasOptions: false },
  date: { icon: CalendarIcon, label: "Date", hasOptions: false },
  number: { icon: HashIcon, label: "Number", hasOptions: false }
}

const FormBuilder = React.forwardRef<HTMLDivElement, FormBuilderProps>(
  ({ 
    fields, 
    onFieldsChange,
    onPreview,
    editable = true,
    className,
    ...props 
  }, ref) => {
    const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)

    const addField = (type: FieldType) => {
      const newField: FormField = {
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        label: `New ${fieldTypeConfig[type].label}`,
        required: false,
        options: fieldTypeConfig[type].hasOptions ? ['Option 1', 'Option 2'] : undefined
      }
      onFieldsChange([...fields, newField])
    }

    const updateField = (index: number, updates: Partial<FormField>) => {
      const newFields = [...fields]
      newFields[index] = { ...newFields[index], ...updates }
      onFieldsChange(newFields)
    }

    const removeField = (index: number) => {
      const newFields = fields.filter((_, i) => i !== index)
      onFieldsChange(newFields)
    }

    const moveField = (fromIndex: number, toIndex: number) => {
      const newFields = [...fields]
      const [movedField] = newFields.splice(fromIndex, 1)
      newFields.splice(toIndex, 0, movedField)
      onFieldsChange(newFields)
    }

    const addOption = (fieldIndex: number) => {
      const field = fields[fieldIndex]
      if (field.options) {
        const newOptions = [...field.options, `Option ${field.options.length + 1}`]
        updateField(fieldIndex, { options: newOptions })
      }
    }

    const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
      const field = fields[fieldIndex]
      if (field.options) {
        const newOptions = [...field.options]
        newOptions[optionIndex] = value
        updateField(fieldIndex, { options: newOptions })
      }
    }

    const removeOption = (fieldIndex: number, optionIndex: number) => {
      const field = fields[fieldIndex]
      if (field.options && field.options.length > 1) {
        const newOptions = field.options.filter((_, i) => i !== optionIndex)
        updateField(fieldIndex, { options: newOptions })
      }
    }

    const FieldEditor: React.FC<{ field: FormField; index: number }> = ({ field, index }) => {
      const config = fieldTypeConfig[field.type]
      const FieldIcon = config.icon

      return (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Drag Handle */}
              <div className="cursor-move text-muted-foreground mt-2">
                <GripVerticalIcon className="h-4 w-4" />
              </div>
              
              {/* Field Icon */}
              <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded">
                <FieldIcon className="h-4 w-4 text-primary" />
              </div>
              
              {/* Field Configuration */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    placeholder="Field label"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">{config.label}</span>
                </div>
                
                {field.description && (
                  <Input
                    value={field.description}
                    onChange={(e) => updateField(index, { description: e.target.value })}
                    placeholder="Field description"
                  />
                )}
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                      className="rounded"
                    />
                    Required
                  </label>
                  
                  {field.placeholder !== undefined && (
                    <Input
                      value={field.placeholder || ''}
                      onChange={(e) => updateField(index, { placeholder: e.target.value })}
                      placeholder="Placeholder text"
                      className="flex-1"
                    />
                  )}
                </div>
                
                {/* Options for select, radio, checkbox fields */}
                {config.hasOptions && field.options && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Options:</label>
                    {field.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                          className="flex-1"
                        />
                        {field.options!.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(index, optionIndex)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(index)}
                      className="w-full"
                    >
                      <PlusIcon className="h-3 w-3 mr-1" />
                      Add Option
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Remove Field */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeField(index)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <TrashIcon className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <div ref={ref} className={cn("", className)} {...props}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Form Builder ({fields.length} fields)
              </CardTitle>
              <div className="flex gap-2">
                {onPreview && (
                  <Button variant="outline" onClick={onPreview}>
                    Preview
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Field Types Toolbar */}
            {editable && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-medium mb-3">Add Field:</h4>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {Object.entries(fieldTypeConfig).map(([type, config]) => {
                    const Icon = config.icon
                    return (
                      <Button
                        key={type}
                        variant="outline"
                        size="sm"
                        onClick={() => addField(type as FieldType)}
                        className="flex flex-col h-auto py-3 px-2 text-xs"
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        {config.label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}
            
            {/* Form Fields */}
            <div className="space-y-4">
              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <TypeIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No fields added yet.</p>
                  <p className="text-sm">Add fields using the toolbar above.</p>
                </div>
              ) : (
                fields.map((field, index) => (
                  <FieldEditor key={field.id} field={field} index={index} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
)

FormBuilder.displayName = "FormBuilder"

export { FormBuilder }
export type { FormBuilderProps }