import { useState, useCallback } from 'react'

export type FieldErrors = Record<string, string>

export type ValidationRules<T extends Record<string, any>> = {
  [K in keyof T]?: (value: T[K], allValues: T) => string | null
}

export function useFormValidation<T extends Record<string, any>>(
  rules: ValidationRules<T>,
  apiErrors?: Record<string, string> | null
) {
  const [errors, setErrors] = useState<FieldErrors>({})

  const validate = useCallback(
    (values: T): boolean => {
      const newErrors: FieldErrors = {}
      for (const [field, validator] of Object.entries(rules)) {
        if (validator) {
          const error = validator(values[field], values)
          if (error) newErrors[field] = error
        }
      }
      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    },
    [rules]
  )

  const setApiErrors = useCallback((serverErrors: Record<string, string>) => {
    setErrors(prev => ({ ...prev, ...serverErrors }))
  }, [])

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors({})
  }, [])

  const getFieldError = useCallback(
    (field: string): string | undefined => {
      return errors[field] || apiErrors?.[field]
    },
    [errors, apiErrors]
  )

  const hasErrors = Object.keys(errors).length > 0 || (apiErrors && Object.keys(apiErrors).length > 0)

  return {
    errors,
    validate,
    setApiErrors,
    clearFieldError,
    clearAllErrors,
    getFieldError,
    hasErrors,
    setErrors,
  }
}

export function required(label: string) {
  return (value: any): string | null => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${label} is required`
    }
    return null
  }
}

export function minLength(label: string, min: number) {
  return (value: any): string | null => {
    if (typeof value === 'string' && value.length > 0 && value.length < min) {
      return `${label} must be at least ${min} characters`
    }
    return null
  }
}

export function maxLength(label: string, max: number) {
  return (value: any): string | null => {
    if (typeof value === 'string' && value.length > max) {
      return `${label} must be at most ${max} characters`
    }
    return null
  }
}

export function matchField(label: string, otherValue: any) {
  return (value: any): string | null => {
    if (value !== otherValue) {
      return `${label} does not match`
    }
    return null
  }
}
