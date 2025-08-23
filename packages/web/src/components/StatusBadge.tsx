import { Badge } from '@chakra-ui/react';

export function StatusBadge({
  status,
}: {
  status: 'LIVE' | 'PAUSED' | 'FINISHED' | 'IDLE';
}) {
  const map = {
    LIVE: { colorPalette: 'green', bg: 'green.600/20', label: 'LIVE' },
    PAUSED: { colorPalette: 'orange', bg: 'orange.500/20', label: 'PAUSED' },
    FINISHED: { colorPalette: 'gray', bg: 'whiteAlpha.300', label: 'FINISHED' },
    IDLE: { colorPalette: 'gray', bg: 'whiteAlpha.300', label: 'IDLE' },
  };
  const c = map[status] ?? map.IDLE;
  return (
    <Badge
      px={3}
      py={1}
      bg={c.bg}
      colorPalette={c.colorPalette}
      borderRadius="full"
    >
      {c.label}
    </Badge>
  );
}
