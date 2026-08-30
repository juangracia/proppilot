from app.domain.indices.fetchers.argentina_datos_ipc import ArgentinaDatosIpcFetcher
from app.domain.indices.fetchers.base import ExternalIndexFetcher
from app.domain.indices.fetchers.bcra_icl import BcraIclFetcher
from app.domain.indices.fetchers.dolar_api import DolarApiFetcher

__all__ = [
    "ExternalIndexFetcher",
    "DolarApiFetcher",
    "BcraIclFetcher",
    "ArgentinaDatosIpcFetcher",
]
