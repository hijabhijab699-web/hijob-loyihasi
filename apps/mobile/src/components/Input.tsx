import { useState, type ReactNode } from 'react';
import {
  Pressable,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface Props extends TextInputProps {
  icon?: ReactNode;
  rightSlot?: ReactNode;
  error?: string;
  hint?: string;
}

export function Input({ icon, rightSlot, error, hint, style, ...rest }: Props) {
  const { colors, theme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          height: 56,
          borderRadius: theme.radii.pill,
          backgroundColor: colors.surfaceGlass,
          borderWidth: 1,
          borderColor: focused ? colors.gold : error ? colors.danger : colors.rule,
          paddingHorizontal: theme.spacing[5],
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {icon}
        <TextInput
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={colors.muted}
          style={[
            {
              flex: 1,
              color: colors.ink,
              fontFamily: theme.fontFamilies.body,
              fontSize: theme.fontSizes.md,
            },
            style,
          ]}
        />
        {rightSlot}
      </View>
      {(hint || error) && (
        <Text
          variant="caption"
          color={error ? 'danger' : 'muted'}
          style={{ paddingHorizontal: theme.spacing[5] }}
        >
          {error ?? hint}
        </Text>
      )}
    </View>
  );
}

interface PasswordInputProps extends Omit<Props, 'secureTextEntry' | 'rightSlot'> {}

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();

  return (
    <Input
      {...props}
      secureTextEntry={!visible}
      rightSlot={
        <Pressable onPress={() => setVisible((v) => !v)} hitSlop={12}>
          <Text color="muted">{visible ? '⊘' : '◉'}</Text>
        </Pressable>
      }
    />
  );
}
