import React from 'react';
import { Container, Group, Image } from '@mantine/core'; // 移除无用的 useMantineTheme
import classes from '@/styles/Header.module.css';
import { pageConfig } from '@/uptime.config';
import { PageConfigLink } from '@/types/config';

export default function Header({ style }: { style?: React.CSSProperties }) {
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
            {/* 核心修复：用原生媒体查询替代 Mantine theme.fn */}
            <div
              style={{
                height: 56,
                width: 140, // 移动端基础宽度
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'xl',
                fontWeight: 700,
                background: 'linear-gradient(90deg, blue, cyan)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                // 原生 CSS 媒体查询（匹配 Mantine sm 断点 640px）
                '@media (min-width: 640px)': {
                  width: 190, // 大屏宽度
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
