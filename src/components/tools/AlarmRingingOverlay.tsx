/**
 * SmartHub - AlarmRingingOverlay Component
 * Replaced with exact screenshot-matched AlarmRingingScreen.
 */

import React from 'react';
import { Language } from '../../types';
import { AlarmItem } from '../../utils/alarmEngine';
import { AlarmRingingScreen } from '../alarm/AlarmRingingScreen';

interface Props {
  alarm: AlarmItem;
  lang: Language;
}

export const AlarmRingingOverlay: React.FC<Props> = ({ alarm, lang }) => {
  return <AlarmRingingScreen alarm={alarm} lang={lang} />;
};
