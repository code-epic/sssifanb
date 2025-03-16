import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {Observable, throwError} from 'rxjs';
import { environment } from 'src/environments/environment';
import { IAPICore } from '../models/api/api-model';
import {catchError} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
    // URL = environment.API
    // hash = environment.Hash
    //
    // httpOptions = {
    //     headers: new HttpHeaders({
    //         'Content-Type': 'application/json',
    //         'Authorization': 'Bearer ' + sessionStorage.getItem('token')
    //     })
    // };
    //
    // constructor(private http: HttpClient) {
    // }
    //
    // Ejecutar(xAPI: IAPICore): Observable<any> {
    //     const url = this.URL + "crud" + this.hash
    //     return this.http.post<any>(url, xAPI, this.httpOptions);
    // }

    // EnviarArchivos(frm: FormData): Observable<any> {
    //     var httpOptions = {
    //         headers: new HttpHeaders({
    //             'Authorization': 'Bearer ' + sessionStorage.getItem('token')
    //         })
    //     };
    //     return this.http.post<any>(this.URL + "subirarchivos", frm, httpOptions);
    // }

    // Dws(peticion: string): string {
    //     return this.URL + 'dw/' + peticion
    // }
// }

    private _Url: string = environment.api;
    private _Api: string = environment.path + environment.hash;
    constructor(private _httpClient: HttpClient) {}

    getBlob(): Observable<Blob> {
        const path = this._getPath();
        return this._httpClient.get(path, { responseType: 'blob' });
    }

    getFile() {
        const path = this._getPath();
        return this._httpClient.get(path, { responseType: 'blob' });
    }

    public getOne<MODEL>(
        url: string,
        params:
            | HttpParams
            | {
            [param: string]:
                | string
                | number
                | boolean
                | ReadonlyArray<string | number | boolean>;
        }
            | null = null,
        headers: HttpHeaders | { [header: string]: string | string[] } | null = null
    ): Observable<MODEL> {
        const path = this._getPath();
        return this._httpClient
            .get<MODEL>(path, this._getOptions(params, headers))
            .pipe(catchError((error: any) => this._handleError(this, error)));
    }

    public getAll<MODEL>(
        params:
            | HttpParams
            | {
            [param: string]:
                | string
                | number
                | boolean
                | ReadonlyArray<string | number | boolean>;
        }
            | null = null,
        headers: HttpHeaders | { [header: string]: string | string[] } | null = null
    ): Observable<MODEL[]> {
        const path = this._getPath();
        return this._httpClient
            .get<MODEL[]>(path, this._getOptions(params, headers))
            .pipe(catchError((error: any) => this._handleError(this, error)));
    }

    public post<MODEL, RESPONSE>(
        body: MODEL,
        params:
            | HttpParams
            | {
            [param: string]:
                | string
                | number
                | boolean
                | ReadonlyArray<string | number | boolean>;
        }
            | null = null,
        headers: HttpHeaders | { [header: string]: string | string[] } | null = null
    ): Observable<RESPONSE> {
        const path = this._getPath();
        return this._httpClient
            .post<RESPONSE>(path, body, this._getOptions(params, headers))
            .pipe(catchError((error: any) => this._handleError(this, error)));
    }

    public postLogin<MODEL, RESPONSE>(
        path: any,
        body: MODEL,
        params:
            | HttpParams
            | {
            [param: string]:
                | string
                | number
                | boolean
                | ReadonlyArray<string | number | boolean>;
        }
            | null = null,
        headers: HttpHeaders | { [header: string]: string | string[] } | null = null
    ): Observable<RESPONSE> {
        const uri = this._getPathLogin(path);
        return this._httpClient
            .post<RESPONSE>(uri, body, this._getOptions(params, headers))
            .pipe(catchError((error: any) => this._handleError(this, error)));
    }

    public sendFile<MODEL, RESPONSE>(
        path: any,
        body: MODEL,
        params:
            | HttpParams
            | {
            [param: string]:
                | string
                | number
                | boolean
                | ReadonlyArray<string | number | boolean>;
        }
            | null = null,
        headers: HttpHeaders | { [header: string]: string | string[] } | null = null
    ): Observable<RESPONSE> {
        const uri = this._getPathLogin(path);
        return this._httpClient
            .post<RESPONSE>(uri, body, this._getOptions(params, headers))
            .pipe(catchError((error: any) => this._handleError(this, error)));
    }

    public put<MODEL, RESPONSE>(
        url: string,
        body: MODEL,
        params:
            | HttpParams
            | {
            [param: string]:
                | string
                | number
                | boolean
                | ReadonlyArray<string | number | boolean>;
        }
            | null = null,
        headers: HttpHeaders | { [header: string]: string | string[] } | null = null
    ): Observable<RESPONSE> {
        const path = this._getPath();
        return this._httpClient
            .put<RESPONSE>(path, body, this._getOptions(params, headers))
            .pipe(catchError((error: any) => this._handleError(this, error)));
    }

    public delete<RESPONSE>(
        url: string,
        params:
            | HttpParams
            | {
            [param: string]:
                | string
                | number
                | boolean
                | ReadonlyArray<string | number | boolean>;
        }
            | null = null,
        headers: HttpHeaders | { [header: string]: string | string[] } | null = null
    ): Observable<RESPONSE> {
        const path = this._getPath();
        return this._httpClient
            .delete<RESPONSE>(path, this._getOptions(params, headers))
            .pipe(catchError((error: any) => this._handleError(this, error)));
    }

    private _handleError(_parent: ApiService, error: any): Observable<never> {
        return throwError(() => new Error(error));
    }

    private _getOptions(
        params:
            | HttpParams
            | {
            [param: string]:
                | string
                | number
                | boolean
                | ReadonlyArray<string | number | boolean>;
        }
            | null = null,
        headers: HttpHeaders | { [header: string]: string | string[] } | null = null
    ): Options {
        const options: Options = {};
        if (params != null) {
            options.params = params;
        }
        if (headers != null) {
            options.headers = headers;
        }
        return options;
    }

    private _getPath(): string {
        let path: string;
        path = `${this._Url}${this._Api}`;
        return path;
    }

    private _getPathLogin(subpath: any): string {
        let path: string;
        path = `${this._Url}${subpath}`;
        return path;
    }
}

interface Options {
    headers?:
        | HttpHeaders
        | {
        [header: string]: string | string[];
    };
    params?:
        | HttpParams
        | {
        [param: string]:
            | string
            | number
            | boolean
            | ReadonlyArray<string | number | boolean>;
    };
}
