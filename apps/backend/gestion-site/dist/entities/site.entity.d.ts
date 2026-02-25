import { Document, Types } from 'mongoose';
export declare class Site extends Document {
    nom: string;
    adresse: string;
    localisation: string;
    budget: number;
    description?: string;
    estActif: boolean;
    area: number;
    status: string;
    progress: number;
    workStartDate: Date;
    workEndDate: Date;
    projectId: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    get formattedBudget(): string;
}
export declare const SiteSchema: import("mongoose").Schema<Site, import("mongoose").Model<Site, any, any, any, (Document<unknown, any, Site, any, import("mongoose").DefaultSchemaOptions> & Site & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Site, any, import("mongoose").DefaultSchemaOptions> & Site & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}), any, Site>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Site, Document<unknown, {}, Site, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    nom?: import("mongoose").SchemaDefinitionProperty<string, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    adresse?: import("mongoose").SchemaDefinitionProperty<string, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    localisation?: import("mongoose").SchemaDefinitionProperty<string, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    budget?: import("mongoose").SchemaDefinitionProperty<number, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    description?: import("mongoose").SchemaDefinitionProperty<string, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    estActif?: import("mongoose").SchemaDefinitionProperty<boolean, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    area?: import("mongoose").SchemaDefinitionProperty<number, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    status?: import("mongoose").SchemaDefinitionProperty<string, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    progress?: import("mongoose").SchemaDefinitionProperty<number, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    workStartDate?: import("mongoose").SchemaDefinitionProperty<Date, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    workEndDate?: import("mongoose").SchemaDefinitionProperty<Date, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    projectId?: import("mongoose").SchemaDefinitionProperty<string, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    coordinates?: import("mongoose").SchemaDefinitionProperty<{
        lat: number;
        lng: number;
    }, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    createdBy?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    updatedBy?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    readonly formattedBudget?: import("mongoose").SchemaDefinitionProperty<string, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
}, Site>;
