import { InternalError } from '@src/util/errors/internal-error';
import config, { IConfig } from 'config'
import * as HTTPUtil from '@src/util/request';

export interface StormGlassPointSource {
  [key: string]: number;
}

export interface StormGlassPoint {
  readonly time: string;
  readonly waveHeight: StormGlassPointSource;
  readonly waveDirection: StormGlassPointSource;
  readonly swellDirection: StormGlassPointSource;
  readonly swellHeight: StormGlassPointSource;
  readonly swellPeriod: StormGlassPointSource;
  readonly windDirection: StormGlassPointSource;
  readonly windSpeed: StormGlassPointSource;
}

export interface StormGlassForecastResponse {
  hours: StormGlassPoint[];
}

export interface ForecastPoint {
  time: string;
  waveHeight: number;
  waveDirection: number;
  swellDirection: number;
  swellHeight: number;
  swellPeriod: number;
  windDirection: number;
  windSpeed: number;
}

export class ClientRequestError extends InternalError {
  constructor(message: string) {
    const internalMessage =
      'Unexpected error when trying to communicate to StormGlass';
    super(`${internalMessage}: ${message}`);
  }
}

export class StormGlassResponseError extends InternalError {
  constructor(message: string) {
    const internalMessage =
      'Unexpected error returned by the StormGlass service';
    super(`${internalMessage}: ${message}`);
  }
}

const stormGlassResourceConfig: IConfig = config.get('App.resources.StormGlass')

export class StormGlass {
  readonly stormGrassAPIParams =
    'swellDirection,swellHeight,swellPeriod,waveDirection,waveHeight,windDirection,windSpeed';
  readonly stormGrassAPISource = 'noaa';
  constructor(protected request = new HTTPUtil.Request()) {}
  public async fetchPoints(lat: number, lng: number): Promise<ForecastPoint[]> {
    try {
      const response = await this.request.get<StormGlassForecastResponse>(
        `${stormGlassResourceConfig.get('apiUrl')}/weather/point?params=${this.stormGrassAPIParams}&source=${this.stormGrassAPISource}&end=1592113802&lat=${lat}&lng=${lng}`,
        {
          headers: {
            Authorization: stormGlassResourceConfig.get('apiToken'),
          },
        }
      );
      return this.normalizeResponse(response.data);
    } catch (err) {
      if(HTTPUtil.Request.isRequestError(err)){
        throw new StormGlassResponseError(`Error: ${JSON.stringify(err.response.data)} Code: ${err.response.status}`)
      }
      throw new ClientRequestError(err.message);
    }
  }
  private normalizeResponse(
    points: StormGlassForecastResponse
  ): ForecastPoint[] {
    return points.hours.filter(this.isValidPoint.bind(this)).map((point) => ({
      swellDirection: point.swellDirection[this.stormGrassAPISource],
      swellHeight: point.swellHeight[this.stormGrassAPISource],
      swellPeriod: point.swellPeriod[this.stormGrassAPISource],
      time: point.time,
      waveDirection: point.waveDirection[this.stormGrassAPISource],
      waveHeight: point.waveHeight[this.stormGrassAPISource],
      windDirection: point.windDirection[this.stormGrassAPISource],
      windSpeed: point.windSpeed[this.stormGrassAPISource],
    }));
  }

  private isValidPoint(point: Partial<StormGlassPoint>): boolean {
    return !!(
      point.time &&
      point.swellDirection?.[this.stormGrassAPISource] &&
      point.swellHeight?.[this.stormGrassAPISource] &&
      point.swellPeriod?.[this.stormGrassAPISource] &&
      point.waveDirection?.[this.stormGrassAPISource] &&
      point.waveHeight?.[this.stormGrassAPISource] &&
      point.windDirection?.[this.stormGrassAPISource] &&
      point.windSpeed?.[this.stormGrassAPISource]
    );
  }
}
