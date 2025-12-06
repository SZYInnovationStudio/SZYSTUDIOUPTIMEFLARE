import React from 'react';
import { Container, Group, Image } from '@mantine/core'; // 保留 Image 导入（按要求）
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
            {/* 核心修改：将图片替换为文字，保留原 Image 组件的尺寸/布局属性 */}
            <div
              style={{
                height: 56,
                width: { base: 140, sm: 190 }, // 保留原尺寸配置
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'xl',
                fontWeight: 700,
                background: 'linear-gradient(90deg, blue, cyan)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
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
