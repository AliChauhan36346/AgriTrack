import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Play, Pause, FastForward, RotateCcw } from 'lucide-react-native';
import { PlaybackSpeed } from '../../types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { elevation } from '../../theme/elevation';

interface PlaybackScrubberProps {
  isPlaying: boolean;
  progress: number; // 0.0 to 1.0
  currentTime: string;
  totalTime?: string;
  speed: PlaybackSpeed;
  onTogglePlay: () => void;
  onSeek: (ratio: number) => void;
  onToggleSpeed: () => void;
  style?: StyleProp<ViewStyle>;
}

export const PlaybackScrubber: React.FC<PlaybackScrubberProps> = ({
  isPlaying,
  progress,
  currentTime,
  totalTime = '11:35 AM',
  speed,
  onTogglePlay,
  onSeek,
  onToggleSpeed,
  style,
}) => {
  const [trackWidth, setTrackWidth] = React.useState<number>(0);

  const handleTrackPress = (event: GestureResponderEvent) => {
    const { locationX } = event.nativeEvent;
    if (trackWidth > 0) {
      const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
      onSeek(ratio);
    }
  };

  const progressPercent = Math.round(Math.max(0, Math.min(1, progress)) * 100);

  return (
    <View style={[styles.container, elevation.lg, style]}>
      {/* Top row: Current time display, progress percentage, speed toggle */}
      <View style={styles.topRow}>
        <View style={styles.timeTag}>
          <Text style={styles.timeLabel}>Route Timestamp</Text>
          <Text style={styles.timeValue}>{currentTime}</Text>
        </View>

        <TouchableOpacity
          style={styles.speedButton}
          onPress={onToggleSpeed}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Playback speed ${speed}x`}
        >
          <FastForward size={14} color={colors.accentBlue} style={styles.speedIcon} />
          <Text style={styles.speedText}>{speed}x Speed</Text>
        </TouchableOpacity>
      </View>

      {/* Interactive Progress Bar */}
      <TouchableOpacity
        activeOpacity={1}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        onPress={handleTrackPress}
        style={styles.trackContainer}
      >
        <View style={styles.trackBackground}>
          <View style={[styles.trackFill, { width: `${progressPercent}%` }]} />
          <View
            style={[
              styles.scrubberThumb,
              { left: `${progressPercent}%` },
            ]}
          />
        </View>
      </TouchableOpacity>

      {/* Bottom controls row */}
      <View style={styles.controlsRow}>
        <Text style={styles.timestampSub}>09:00 AM</Text>

        <View style={styles.centerControls}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={onTogglePlay}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause route playback' : 'Play route playback'}
          >
            {isPlaying ? (
              <Pause size={22} color={colors.cardSurface} />
            ) : progress >= 1 ? (
              <RotateCcw size={20} color={colors.cardSurface} />
            ) : (
              <Play size={22} color={colors.cardSurface} style={styles.playIconOffset} />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.timestampSub}>{totalTime}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardSurface,
    borderRadius: spacing.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeTag: {
    flexDirection: 'column',
  },
  timeLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralLight,
    fontWeight: typography.fontWeights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeValue: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  speedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentBlueLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: spacing.pillRadius,
    minHeight: 34,
  },
  speedIcon: {
    marginRight: 4,
  },
  speedText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.accentBlue,
  },
  trackContainer: {
    paddingVertical: 10,
    justifyContent: 'center',
  },
  trackBackground: {
    height: 6,
    backgroundColor: colors.neutralDivider,
    borderRadius: 3,
    position: 'relative',
  },
  trackFill: {
    height: 6,
    backgroundColor: colors.accentBlue,
    borderRadius: 3,
  },
  scrubberThumb: {
    position: 'absolute',
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accentBlue,
    borderWidth: 2,
    borderColor: colors.cardSurface,
    marginLeft: -8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconOffset: {
    marginLeft: 2,
  },
  timestampSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralLight,
    fontWeight: typography.fontWeights.medium,
    width: 60,
  },
});
