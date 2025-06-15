import React from 'react';
import type { ComponentProps } from 'react';

type SelectProps = ComponentProps<'select'>;
type ButtonProps = ComponentProps<'button'>;
type DivProps = ComponentProps<'div'>;
type OptionProps = ComponentProps<'option'>;
type SpanProps = ComponentProps<'span'>;

export const Select = ({ children, ...props }: SelectProps) => React.createElement('select', props, children);
export const SelectTrigger = ({ children, ...props }: ButtonProps) => React.createElement('button', props, children);
export const SelectContent = ({ children, ...props }: DivProps) => React.createElement('div', props, children);
export const SelectItem = ({ children, ...props }: OptionProps) => React.createElement('option', props, children);
export const SelectValue = ({ children, ...props }: SpanProps) => React.createElement('span', props, children); 