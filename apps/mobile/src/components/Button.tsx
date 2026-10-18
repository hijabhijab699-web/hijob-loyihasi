import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeProvider';

interface Props extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold';
  size?: 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  loading,
  icon,
  iconRight,
  fullWidth = true,
  disabled,
  style,
  onPress,
  ...rest
}: Props) {
  const { colors, theme } = useTheme();

  const handlePress = (event: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
    // Buttons feel lifeless without a tap — the intensity matches how important the action is.
    Haptics.impactAsync(
      variant === 'gold' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    ).catch(() => {});
    onPress?.(event);
  };

  const height = size === 'lg' ? 56 : 48;
  const radius = theme.radii.pill;
  const paddingHorizontal = theme.spacing[6];

  const isDisabled = disabled || loading;

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        opacity: isDisabled ? 0.6 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.oliveDark : colors.surface} />
      ) : (
        <>
          {icon}
          <Text
            variant="button"
            color={
              variant === 'gold'
                ? 'ink'
                : variant === 'ghost' || variant === 'secondary'
                  ? 'oliveDeep'
                  : 'surface'
            }
          >
            {label}
          </Text>
          {iconRight}
        </>
      )}
    </View>
  );

  const baseStyle = {
    height,
    borderRadius: radius,
    paddingHorizontal,
    alignSelf: (fullWidth ? 'stretch' : 'flex-start') as 'stretch' | 'flex-start',
    overflow: 'hidden' as const,
  };

  if (variant === 'gold') {
    return (
      <Pressable {...rest} onPress={handlePress} disabled={isDisabled} style={[baseStyle, style]}>
        <LinearGradient
          colors={[colors.goldSoft, colors.gold, colors.goldDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, justifyContent: 'center', paddingHorizontal }}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  const bg =
    variant === 'primary'
      ? colors.oliveDark
      : variant === 'secondary'
        ? colors.surface
        : 'transparent';

  return (
    <Pressable
      {...rest}
      onPress={handlePress}
      disabled={isDisabled}
      style={[
        baseStyle,
        {
          backgroundColor: bg,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: colors.rule,
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}
