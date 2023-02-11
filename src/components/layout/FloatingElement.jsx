import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  margin: 8px;
  padding: 16px 20px;
  background: #121616;
  border-radius: 8px;
`;


export default function FloatingElement({
  style = undefined,
  children,
  stretchVertical = false,
  setHeight = undefined,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (setHeight) {
      setTimeout(function () {
        setHeight(ref.current?.offsetHeight);
      }, 2000);
    }
    // eslint-disable-next-line
  }, []);

  return (
    <Wrapper
      className="thin-scroll"
      style={{
        height: stretchVertical ? 'calc(100% - 10px)' : undefined,
        borderRadius: 10,
        ...style,
      }}
      ref={ref}
    >
      {children}
    </Wrapper>
  );
}
