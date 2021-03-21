export interface LayerEnhancement {
    purchased?: boolean;
    datasetName?: string;
}

export interface AccountEnhancements {
    enhancementData: {
        [layerId: string]: LayerEnhancement;
    }
}
