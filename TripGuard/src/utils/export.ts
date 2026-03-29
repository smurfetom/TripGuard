import { Platform, Share } from 'react-native';
import { Event, TripSession } from '../types';

function escapeCsv(value: string | number | undefined): string {
  const text = `${value ?? ''}`;
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildTripCsv(session: TripSession): string {
  const events: Event[] = session.segments.flatMap((segment) => segment.events);
  const header = [
    'timestamp',
    'type',
    'stand_number',
    'progressed_stands',
    'actual_tt',
    'expected_tt',
    'diff',
    'calculated_cumulative_volume',
    'actual_cumulative_volume',
    'gain_loss_volume',
    'slug_correction_volume',
    'slug_volume',
    'comment',
    'volume_unit',
    'mode',
  ];

  const lines = events.map((event) => [
    new Date(event.timestamp).toISOString(),
    event.type,
    event.standNumber,
    event.progressedStands ?? '',
    event.actualTT.toFixed(2),
    event.expectedTT.toFixed(2),
    event.diff.toFixed(2),
    event.calculatedCumulativeVolume?.toFixed(2) ?? '',
    event.actualCumulativeVolume?.toFixed(2) ?? '',
    event.gainLossVolume?.toFixed(2) ?? '',
    event.slugCorrectionVolume?.toFixed(2) ?? '',
    event.slugVolume?.toFixed(2) ?? '',
    event.comment ?? '',
    session.volumeUnit,
    session.mode,
  ].map(escapeCsv).join(','));

  return [header.join(','), ...lines].join('\n');
}

export async function exportTripCsv(session: TripSession): Promise<void> {
  const csv = buildTripCsv(session);
  const fileName = `tripguard-${session.mode.toLowerCase()}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return;
  }

  await Share.share({
    title: fileName,
    message: csv,
  });
}
