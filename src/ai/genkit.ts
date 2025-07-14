import {genkit, GenkitPlugin, configureGenkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export function configureGoogleAi(apiKey: string) {
    const plugins: GenkitPlugin[] = [googleAI({apiKey})];
    
    configureGenkit({
        plugins: plugins,
    });
}

export const ai = genkit({
  plugins: [googleAI()],
});
