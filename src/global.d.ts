export {};

declare global {
    interface Window {
        electron: {
            saveJson: (data: any) => void;
        };
    }
}