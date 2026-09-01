// lib/antd/registry.tsx
"use client";

import React, { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { createCache, extractStyle, StyleProvider } from "@ant-design/cssinjs";

export default function AntdRegistry({ children }: { children: React.ReactNode }) {
  const [cache] = useState(() => createCache());

  useServerInsertedHTML(() => {
    const styleText = extractStyle(cache, { plain: true, once: true });

    if (styleText.includes('.data-ant-cssinjs-cache-path{content:"";}')) {
      return null;
    }

    return (
      <style
        id="antd-cssinjs"
        data-rc-order="prepend"
        data-rc-priority="-1000"
        dangerouslySetInnerHTML={{ __html: styleText }}
      />
    );
  });

  return <StyleProvider cache={cache}>{children}</StyleProvider>;
}
