"use client";

import { useEffect } from "react";

export function ResponsiveWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Force viewport meta tag
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
    }

    // Add responsive class to body
    document.body.classList.add('responsive-body');

    // Prevent horizontal scroll
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    document.body.style.maxWidth = '100vw';
    document.body.style.width = '100%';

    // Force responsive behavior on all screens <= 1366px
    const applyResponsiveStyles = () => {
      const viewportWidth = window.innerWidth;
      
      if (viewportWidth <= 1366) {
        // Find all elements with problematic inline styles
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach((el: any) => {
          const style = el.style;
          
          // Fix width issues - target specific large widths
          if (style.width) {
            const widthValue = parseInt(style.width);
            if (!isNaN(widthValue) && widthValue > viewportWidth) {
              el.style.width = '100%';
              el.style.maxWidth = 'calc(100vw - 40px)';
            }
          }
          
          // Fix margin issues - remove large left margins
          if (style.marginLeft) {
            const marginValue = parseInt(style.marginLeft);
            if (!isNaN(marginValue) && marginValue > 50) {
              el.style.marginLeft = '0';
            }
          }
          
          // Fix negative right margins
          if (style.marginRight) {
            const marginValue = parseInt(style.marginRight);
            if (!isNaN(marginValue) && marginValue < 0) {
              el.style.marginRight = '0';
            }
          }
          
          // Fix large padding
          if (style.padding === '40px') {
            el.style.padding = '20px';
          }
        });
      }
    };
    
    // Apply on mount
    applyResponsiveStyles();
    
    // Apply on resize
    window.addEventListener('resize', applyResponsiveStyles);
    
    // Apply after delays to catch dynamically loaded content
    const timeouts = [100, 300, 500, 1000].map(delay => 
      setTimeout(applyResponsiveStyles, delay)
    );
    
    return () => {
      document.body.classList.remove('responsive-body');
      window.removeEventListener('resize', applyResponsiveStyles);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return <>{children}</>;
}
