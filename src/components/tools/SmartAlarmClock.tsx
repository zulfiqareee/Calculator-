/**
 * SmartHub - SmartAlarmClock Component
 * Replaced with modular, modernized AlarmMainView.
 */

import React from 'react';
import { Language } from '../../types';
import { AlarmMainView } from '../alarm/AlarmMainView';

interface Props {
  lang: Language;
}

export const SmartAlarmClock: React.FC<Props> = ({ lang }) => {
  return <AlarmMainView lang={lang} />;
};
