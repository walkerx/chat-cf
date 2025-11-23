declare module 'png-chunks-extract' {
    interface Chunk {
        name: string;
        data: Uint8Array;
    }

    function extract(data: Uint8Array): Chunk[];
    export default extract;
}

declare module 'png-chunk-text' {
    interface TextChunk {
        keyword: string;
        text: string;
    }

    function decode(data: Uint8Array): TextChunk;
    function encode(keyword: string, text: string): Uint8Array;

    export default { decode, encode };
}
