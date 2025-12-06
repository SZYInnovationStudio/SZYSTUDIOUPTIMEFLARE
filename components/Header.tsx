import React from 'react';
import { Container, Group, Image, useMantineTheme } from '@mantine/core'; // 新增 useMantineTheme
import classes from '@/styles/Header.module.css';
import { pageConfig } from '@/uptime.config';
import { PageConfigLink } from '@/types/config';

export default function Header({ style }: { style?: React.CSSProperties }) {
  // 使用 Mantine 主题钩子获取响应式断点
  const theme = useMantineTheme();
  
  const linkToElement = (link: PageConfigLink, i: number) => {
    return (
      <a
        key={i}
        href={link.link}
        target={link.link.startsWith('/') ? undefined : '_blank'}
        className={classes.link}
        data-active={link.highlight}
      >
        {link.label}
      </a>
    );
  };

  const links = [{ label: '事件', link: '/incidents' }, ...(pageConfig.links || [])];

  return (
    <header className={classes.header} style={style}>
      <Container size="md" className={classes.inner}>
        <div>
          <a
            href={window.location.pathname == '/' ? 'https://www.szystudio.cn' : '/'}
            target={window.location.pathname == '/' ? '_blank' : undefined}
          >
            {/* 修复：用媒体查询实现响应式宽度，替代对象格式 */}
            <div
              style={{
                height: 56,
                // 基础宽度 + 媒体查询响应式调整（匹配 Mantine 的 sm 断点）
                width: 140,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'xl',
                fontWeight: 700,
                background: 'linear-gradient(90deg, blue, cyan)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                // Mantine sm 断点默认是 640px，这里用 theme 确保一致性
                [theme.fn.largerThan('sm')]: {
                  width: 190,
                },
              }}
            >
              SZY创新工作室状态监控
            </div>
          </a>
        </div>

        <Group gap={5} visibleFrom="sm">
          {links?.map(linkToElement)}
        </Group>

        <Group gap={5} hiddenFrom="sm">
          {links?.filter((link) => link.highlight || link.link.startsWith('/')).map(linkToElement)}
        </Group>
      </Container>
    </header>
  );
}
