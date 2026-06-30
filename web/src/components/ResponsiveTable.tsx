import { Table, type TableProps } from 'antd';
import { useResponsive } from '../hooks/ResponsiveContext';

export function ResponsiveTable<T extends object = any>(props: TableProps<T>) {
  const { isMobile } = useResponsive();

  const mergedScroll = isMobile
    ? { x: 'max-content', ...(typeof props.scroll === 'object' ? props.scroll : {}) }
    : props.scroll;

  return (
    <Table<T> {...props} scroll={mergedScroll} size={isMobile ? 'small' : props.size || 'middle'} />
  );
}
