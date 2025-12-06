import { Alert, Text } from '@mantine/core'
import { IconInfoCircle } from '@tabler/icons-react'

export default function NoIncidentsAlert({ style }: { style?: React.CSSProperties }) {
  return (
    <Alert
      icon={<IconInfoCircle />}
      title={
        <span
          style={{
            fontSize: '1rem',
            fontWeight: 700,
          }}
        >
          {'本月无故障记录'}
        </span>
      }
      color="gray"
      withCloseButton={false}
      style={{
        position: 'relative',
        margin: '16px auto 0 auto',
        ...style,
      }}
    >
      <Text>本月未发生任何故障。</Text>
    </Alert>
  )
}
