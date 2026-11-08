import { ActivityIndicator, type PressableProps } from 'react-native';

import { colors, size as sizes, type ColorToken } from '@/theme';

import { Icon, type IconName } from './icon';
import { PressScale } from './press-scale';
import { Text } from './text';

export type ButtonVariant =
  | 'primary'
  | 'outline'
  | 'black'
  | 'darkOutline'
  | 'inverse'
  | 'outlineInverse'
  | 'destructive'
  | 'destructiveSubtle'
  | 'destructiveOutline';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  children: string;
  /**
   * - primary: the main action (greenAccent). Never on greenHouse.
   * - inverse / outlineInverse: only on greenHouse bands.
   * - destructive: delete and other irreversible actions (and their confirm step).
   * - destructiveSubtle: a secondary delete under a form's main action; red label on light gray.
   * - destructiveOutline: opens a destructive flow that confirms next (Reset); red outline.
   */
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  icon?: IconName;
  fullWidth?: boolean;
  loading?: boolean;
};

const variants: Record<ButtonVariant, { container: string; label: ColorToken }> = {
  primary: { container: 'bg-green-accent border-green-accent', label: 'textWhite' },
  outline: { container: 'bg-transparent border-green-accent', label: 'greenAccent' },
  black: { container: 'bg-black border-black', label: 'textWhite' },
  darkOutline: { container: 'bg-transparent border-text-black', label: 'textBlack' },
  inverse: { container: 'bg-white border-white', label: 'greenAccent' },
  outlineInverse: { container: 'bg-transparent border-white', label: 'textWhite' },
  destructive: { container: 'bg-red border-red', label: 'textWhite' },
  destructiveSubtle: { container: 'bg-ceramic border-ceramic', label: 'red' },
  destructiveOutline: { container: 'bg-transparent border-red', label: 'red' },
};

const sizeClass = { md: 'min-h-button px-4', sm: 'min-h-button-sm px-3' } as const;

/** The pill button. Every action in the app. No shadows, no square corners. */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth,
  loading,
  disabled,
  ...rest
}: ButtonProps) {
  const v = variants[variant];
  const isSm = size === 'sm';
  const extraSlop = isSm ? (sizes.tapTarget - sizes.buttonSm) / 2 : 0;

  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={children}
      hitSlop={extraSlop}
      disabled={disabled || loading}
      containerClassName={fullWidth ? 'self-stretch' : 'self-start'}
      className={`flex-row items-center justify-center gap-2 border rounded-pill ${sizeClass[size]} ${v.container}`}
      {...rest}>
      {loading ? (
        <ActivityIndicator size="small" color={colors[v.label]} />
      ) : (
        <>
          {icon && <Icon name={icon} size={isSm ? 14 : 16} color={v.label} />}
          <Text variant={isSm ? 'buttonLabelSm' : 'buttonLabel'} color={v.label}>
            {children}
          </Text>
        </>
      )}
    </PressScale>
  );
}
