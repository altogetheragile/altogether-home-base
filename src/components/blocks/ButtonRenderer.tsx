import React from "react";
import { Button } from "@/components/ui/button";

interface ButtonRendererProps {
  content?: any;
  styles?: any;
}

/**
 * ButtonRenderer
 * - Handles both legacy CTA buttons (single button) and new multi-button arrays.
 */
export const ButtonRenderer: React.FC<ButtonRendererProps> = ({ content, styles }) => {
  const safeContent = content || {};
  const safeStyles = styles || {};

  // Legacy CTA fallback (single button)
  const hasLegacyCTA =
    typeof safeContent.ctaText === "string" &&
    typeof safeContent.ctaLink === "string" &&
    safeContent.ctaText &&
    safeContent.ctaLink;

  // New buttons system
  const buttons = Array.isArray(safeContent.buttons) ? safeContent.buttons : [];

  if (!hasLegacyCTA && buttons.length === 0) return null;

  const buttonSpacing =
    typeof safeStyles.buttonsSpacing === "string"
      ? safeStyles.buttonsSpacing
      : "gap-4";

  return (
    <div className={`flex flex-wrap ${buttonSpacing} justify-center`}>
      {/* Legacy CTA */}
      {hasLegacyCTA && (
        <Button
          variant={
            typeof safeStyles.buttonsVariant === "string"
              ? safeStyles.buttonsVariant
              : "default"
          }
          size={
            typeof safeStyles.buttonsSize === "string"
              ? safeStyles.buttonsSize
              : "lg"
          }
          asChild
          className={`${
            typeof safeStyles.ctaFontWeight === "string"
              ? safeStyles.ctaFontWeight
              : ""
          } w-[200px]`}
          style={{
            ...(safeStyles.ctaBackgroundColor &&
              typeof safeStyles.ctaBackgroundColor === "string" &&
              safeStyles.ctaBackgroundColor !== "default" && {
                backgroundColor: safeStyles.ctaBackgroundColor,
              }),
            ...(safeStyles.ctaTextColor &&
              typeof safeStyles.ctaTextColor === "string" &&
              safeStyles.ctaTextColor !== "default" && {
                color: safeStyles.ctaTextColor,
              }),
          }}
        >
          <a href={String(safeContent.ctaLink)}>{String(safeContent.ctaText)}</a>
        </Button>
      )}

      {/* New buttons array */}
      {buttons.map((button: any, index: number) => {
        if (
          !button ||
          typeof button !== "object" ||
          typeof button.text !== "string" ||
          typeof button.link !== "string"
        ) {
          return null;
        }

        return (
          <Button
            key={index}
            variant={
              button.variant === "default"
                ? typeof safeStyles.buttonsVariant === "string"
                  ? safeStyles.buttonsVariant
                  : "default"
                : typeof button.variant === "string"
                ? button.variant
                : "default"
            }
            size={
              typeof safeStyles.buttonsSize === "string"
                ? safeStyles.buttonsSize
                : "lg"
            }
            asChild
            className={`${
              typeof safeStyles.buttonsFontWeight === "string"
                ? safeStyles.buttonsFontWeight
                : ""
            } w-[200px]`}
            style={{
              ...(safeStyles.buttonsBackgroundColor &&
                typeof safeStyles.buttonsBackgroundColor === "string" &&
                safeStyles.buttonsBackgroundColor !== "default" && {
                  backgroundColor: safeStyles.buttonsBackgroundColor,
                }),
              ...(safeStyles.buttonsTextColor &&
                typeof safeStyles.buttonsTextColor === "string" &&
                safeStyles.buttonsTextColor !== "default" && {
                  color: safeStyles.buttonsTextColor,
                }),
            }}
          >
            <a href={String(button.link)}>{String(button.text)}</a>
          </Button>
        );
      })}
    </div>
  );
};