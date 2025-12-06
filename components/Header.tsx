import React from 'react';
import { Container, Group, Image } from '@mantine/core'; // 保留 Image 导入
import classes from '@/styles/Header.module.css';
import { pageConfig } from '@/uptime.config';
import { PageConfigLink } from '@/types/config';

// 完善 Props 类型定义
interface HeaderProps {
  style?: React.CSSProperties;
}

export default function Header({ style }: HeaderProps) {
  // 为 linkToElement 添加明确的类型注解
  const linkToElement = (link: PageConfigLink, i: number) => {
    return (
      <a
        key={i}
        href={link.link}
        target={link.link.startsWith('/') ? undefined : '_blank'}
        rel={link.link.startsWith('/') ? undefined : 'noopener noreferrer'} // 安全补充
        className={classes.link}
        data-active={link.highlight ? 'true' : 'false'} // 确保 data 属性有有效值
      >
        {link.label}
      </a>
    );
  };

  // 修正：补充类型注解和默认 highlight 属性
  const links: PageConfigLink[] = [
    { label: '事件', link: '/incidents', highlight: false },
    ...(pageConfig.links || []),
  ];

  return (
    <header className={classes.header} style={style}> {/* 应用传入的 style */}
      <Container size="md" className={classes.inner}>
        <div>
          <a
            href={window.location.pathname === '/' ? 'https://www.szystudio.cn' : '/'}
            target={window.location.pathname === '/' ? '_blank' : undefined}
            rel={window.location.pathname === '/' ? 'noopener noreferrer' : undefined} // 安全补充
          >
            <Image
              src={pageConfig.logo ?? '/logo.svg'}
              h={56}
              w={{ base: 140, sm: 190 }}
              fit="contain"
              alt="SZY创新工作室状态监控" // 完善 alt 文本，提升可访问性
            />
          </a>
        </div>

        <Group gap={5} visibleFrom="sm">
          {links.map(linkToElement)}
        </Group>

        <Group gap={5} hiddenFrom="sm">
          {links.filter((link) => link.highlight || link.link.startsWith('/')).map(linkToElement)}
        </Group>
      </Container>
    </header>
  );
}
