declare module "webp-converter" {
  export function cwebp(
    input_image: string,
    output_image: string,
    option: string,
    logging?: string
  ): Promise<void>;
  export function dwebp(
    input_webp: string,
    output_image: string,
    option: string,
    logging?: string
  ): Promise<void>;
  export function gif2webp(
    input_gif: string,
    output_webp: string,
    option: string,
    logging?: string
  ): Promise<void>;
  export function webpmux_add(
    input_webp: string,
    output_webp: string,
    icc_profile: string,
    option: string,
    logging?: string
  ): Promise<void>;
  export function webpmux_extract(
    input_webp: string,
    icc_profile: string,
    option: string,
    logging?: string
  ): Promise<void>;
  export function webpmux_strip(
    input_webp: string,
    output_webp: string,
    option: string,
    logging?: string
  ): Promise<void>;
  export function webpmux_set_animation(
    input_webp: string,
    output_webp: string,
    bgcolor: string,
    kmin: string,
    kmax: string,
    logging?: string
  ): Promise<void>;
  export function webpmux_get_frame(
    input_webp: string,
    output_webp: string,
    frame_number: string,
    logging?: string
  ): Promise<void>;
}
