import type { ReactNode } from 'react';
import { Pressable, Modal as RNModal, View } from 'react-native';

import { Icon, icons } from './icon';
import { Text } from './text';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Every modal has a title. */
  title: string;
  /** Content plus one primary action. */
  children: ReactNode;
};

/** A dialog over a black-a50 scrim. Pressing the scrim or the close button calls onClose. */
export function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <RNModal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View className="flex-1 bg-black-alpha-50 items-center justify-center p-3 md:p-4 lg:p-6">
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
        />
        <View
          className="w-full max-w-modal bg-white rounded-card p-4 pt-modal-inset-top gap-3"
          accessibilityViewIsModal>
          <Pressable
            onPress={onClose}
            className="absolute top-3 right-3 size-tap-target items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Close">
            <Icon name={icons.close} size={20} />
          </Pressable>
          <Text variant="h1" accessibilityRole="header">
            {title}
          </Text>
          {children}
        </View>
      </View>
    </RNModal>
  );
}
