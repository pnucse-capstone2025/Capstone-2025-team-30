/**
 * RTCStatsReport에서 표시용 문자열 배열을 생성하는 함수
 * @param report - 현재 RTCStatsReport
 * @param lastReport - 이전 RTCStatsReport (비트레이트 계산용)
 * @return 표시용 문자열 배열
 */
export function createDisplayStringArray(
  report: RTCStatsReport,
  lastReport?: RTCStatsReport | null
): string[] {
  const array: string[] = [];

  report.forEach((stat: any) => {
    if (stat.type === 'inbound-rtp') {
      array.push(`${stat.kind} receiving stream stats`);

      if (stat.codecId !== undefined) {
        const codec = report.get(stat.codecId);
        if (codec) {
          array.push(`Codec: ${codec.mimeType}`);

          if (codec.sdpFmtpLine) {
            codec.sdpFmtpLine.split(";").forEach((fmtp: string) => {
              array.push(` - ${fmtp}`);
            });
          }

          if (codec.payloadType !== undefined) {
            array.push(` - payloadType=${codec.payloadType}`);
          }

          if (codec.clockRate !== undefined) {
            array.push(` - clockRate=${codec.clockRate}`);
          }

          if (codec.channels !== undefined) {
            array.push(` - channels=${codec.channels}`);
          }
        }
      }

      if (stat.kind === "video") {
        if (stat.decoderImplementation) {
          array.push(`Decoder: ${stat.decoderImplementation}`);
        }
        if (stat.frameWidth && stat.frameHeight) {
          array.push(`Resolution: ${stat.frameWidth}x${stat.frameHeight}`);
        }
        if (stat.framesPerSecond !== undefined) {
          array.push(`Framerate: ${stat.framesPerSecond}`);
        }
      }

      if (lastReport && lastReport.has(stat.id)) {
        const lastStats = lastReport.get(stat.id);
        if (lastStats && stat.bytesReceived !== undefined && lastStats.bytesReceived !== undefined) {
          const duration = (stat.timestamp - lastStats.timestamp) / 1000;
          const bitrate = (8 * (stat.bytesReceived - lastStats.bytesReceived) / duration) / 1000;
          array.push(`Bitrate: ${bitrate.toFixed(2)} kbit/sec`);
        }
      }
    } else if (stat.type === 'outbound-rtp') {
      array.push(`${stat.kind} sending stream stats`);

      if (stat.codecId !== undefined) {
        const codec = report.get(stat.codecId);
        if (codec) {
          array.push(`Codec: ${codec.mimeType}`);

          if (codec.sdpFmtpLine) {
            codec.sdpFmtpLine.split(";").forEach((fmtp: string) => {
              array.push(` - ${fmtp}`);
            });
          }

          if (codec.payloadType !== undefined) {
            array.push(` - payloadType=${codec.payloadType}`);
          }

          if (codec.clockRate !== undefined) {
            array.push(` - clockRate=${codec.clockRate}`);
          }

          if (codec.channels !== undefined) {
            array.push(` - channels=${codec.channels}`);
          }
        }
      }

      if (stat.kind === "video") {
        if (stat.encoderImplementation) {
          array.push(`Encoder: ${stat.encoderImplementation}`);
        }
        if (stat.frameWidth && stat.frameHeight) {
          array.push(`Resolution: ${stat.frameWidth}x${stat.frameHeight}`);
        }
        if (stat.framesPerSecond !== undefined) {
          array.push(`Framerate: ${stat.framesPerSecond}`);
        }
      }

      if (lastReport && lastReport.has(stat.id)) {
        const lastStats = lastReport.get(stat.id);
        if (lastStats && stat.bytesSent !== undefined && lastStats.bytesSent !== undefined) {
          const duration = (stat.timestamp - lastStats.timestamp) / 1000;
          const bitrate = (8 * (stat.bytesSent - lastStats.bytesSent) / duration) / 1000;
          array.push(`Bitrate: ${bitrate.toFixed(2)} kbit/sec`);
        }
      }
    }
  });

  return array;
}
