declare namespace google.maps {
    class DistanceMatrixService {
        getDistanceMatrix(request: DistanceMatrixRequest): Promise<DistanceMatrixResponse>
    }

    interface DistanceMatrixRequest {
        origins: (LatLng | string)[]
        destinations: (LatLng | string)[]
        travelMode?: TravelMode
        unitSystem?: UnitSystem
    }

    interface DistanceMatrixResponse {
        rows: DistanceMatrixResponseRow[]
    }

    interface DistanceMatrixResponseRow {
        elements: DistanceMatrixResponseElement[]
    }

    interface DistanceMatrixResponseElement {
        distance?: { text: string; value: number }
        duration?: { text: string; value: number }
        status: string
    }

    enum TravelMode {
        DRIVING = 'DRIVING',
        WALKING = 'WALKING',
        BICYCLING = 'BICYCLING',
        TRANSIT = 'TRANSIT'
    }

    enum UnitSystem {
        METRIC = 0,
        IMPERIAL = 1
    }
}