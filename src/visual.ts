/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {

    // jsCommon
    import ClassAndSelector = jsCommon.CssConstants.ClassAndSelector;
    import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;
    import IMargin = powerbi.visuals.IMargin;
    import PixelConverter = jsCommon.PixelConverter;
    import hexToRGBString = powerbi.common.utils.ColorUtility.hexToRGBString;

    import Selection = d3.Selection;
    import UpdateSelection = d3.selection.Update;

    // powerbi
    import IViewport = powerbi.IViewport;
    import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
    import IEnumType = powerbi.IEnumType;
    import createEnumType = powerbi.createEnumType;
    import IVisual = powerbi.IVisual;
    import IVisualHostServices = powerbi.IVisualHostServices;
    import DataView = powerbi.DataView;
    import DataViewObjects = powerbi.DataViewObjects;
    import DataViewCategoricalColumn = powerbi.DataViewCategoricalColumn;
    import VisualCapabilities = powerbi.VisualCapabilities;
    import VisualDataRoleKind = powerbi.VisualDataRoleKind;
    import SelectEventArgs = powerbi.SelectEventArgs;
    import VisualUpdateOptions = powerbi.VisualUpdateOptions;
    import DataViewAnalysis = powerbi.DataViewAnalysis;
    import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
    import VisualObjectInstance = powerbi.VisualObjectInstance;
    import VisualObjectInstancesToPersist = powerbi.VisualObjectInstancesToPersist;
    import TextMeasurementService = powerbi.TextMeasurementService;
    import TextProperties = powerbi.TextProperties;
    import DataViewCategorical = powerbi.DataViewCategorical;
    import DataViewMetadata = powerbi.DataViewMetadata;
    import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
    import DataViewScopeIdentity = powerbi.DataViewScopeIdentity;
    import VisualInitOptions = powerbi.VisualInitOptions;

    // powerbi.data
    import SemanticFilter = powerbi.data.SemanticFilter;
    import SQExprConverter = powerbi.data.SQExprConverter;
    import Selector = powerbi.data.Selector;
    import SQExpr = powerbi.data.SQExpr;

    // powerbi.visuals
    import SelectableDataPoint = powerbi.visuals.SelectableDataPoint;
    import IInteractivityService = powerbi.visuals.IInteractivityService;
    import valueFormatter = powerbi.visuals.valueFormatter;
    import createInteractivityService = powerbi.visuals.createInteractivityService;
    import isCategoryColumnSelected = powerbi.visuals.isCategoryColumnSelected;
    import converterHelper = powerbi.visuals.converterHelper;
    import SelectionId = powerbi.visuals.SelectionId;
    import IInteractiveBehavior = powerbi.visuals.IInteractiveBehavior;
    import ISelectionHandler = powerbi.visuals.ISelectionHandler;
    import SelectionIdBuilder = powerbi.visuals.SelectionIdBuilder;

    module ChicletBorderStyle {
        export var ROUNDED: string = 'Rounded';
        export var CUT: string = 'Cut';
        export var SQUARE: string = 'Square';

        export var type: IEnumType = createEnumType([
            { value: ROUNDED, displayName: ChicletBorderStyle.ROUNDED },
            { value: CUT, displayName: ChicletBorderStyle.CUT },
            { value: SQUARE, displayName: ChicletBorderStyle.SQUARE },
        ]);
    }

    module ChicletSlicerShowDisabled {
        export var INPLACE: string = 'Inplace';
        export var BOTTOM: string = 'Bottom';
        export var HIDE: string = 'Hide';

        export var type: IEnumType = createEnumType([
            { value: INPLACE, displayName: ChicletSlicerShowDisabled.INPLACE },
            { value: BOTTOM, displayName: ChicletSlicerShowDisabled.BOTTOM },
            { value: HIDE, displayName: ChicletSlicerShowDisabled.HIDE },
        ]);
    }

    export module Orientation {
        export var HORIZONTAL: string = 'Horizontal';
        export var VERTICAL: string = 'Vertical';

        export var type: IEnumType = createEnumType([
            { value: HORIZONTAL, displayName: HORIZONTAL },
            { value: VERTICAL, displayName: VERTICAL }
        ]);
    }

    export interface ChicletSlicerConstructorOptions {
        behavior?: ChicletSlicerWebBehavior;
    }

    export interface ChicletSlicerData {
        categorySourceName: string;
        formatString: string;
        slicerDataPoints: ChicletSlicerDataPoint[];
        slicerSettings: ChicletSlicerSettings;
        hasSelectionOverride?: boolean;
    }

    export interface ChicletSlicerDataPoint extends SelectableDataPoint {
        category?: string;
        value?: number;
        mouseOver?: boolean;
        mouseOut?: boolean;
        isSelectAllDataPoint?: boolean;
        imageURL?: string;
        selectable?: boolean;
        filtered?: boolean;
    }

    export interface ChicletSlicerSettings {
        general: {
            orientation: string;
            columns: number;
            rows: number;
            multiselect: boolean;
            showDisabled: string;
            selection: string;
            selfFilterEnabled: boolean;
            getSavedSelection?: () => string[];
            setSavedSelection?: (filter: SemanticFilter, selectionIds: string[]) => void;
        };
        margin: IMargin;
        header: {
            borderBottomWidth: number;
            show: boolean;
            outline: string;
            fontColor: string;
            background?: string;
            textSize: number;
            outlineColor: string;
            outlineWeight: number;
            title: string;
        };
        headerText: {
            marginLeft: number;
            marginTop: number;
        };
        slicerText: {
            textSize: number;
            height: number;
            width: number;
            fontColor: string;
            selectedColor: string;
            hoverColor: string;
            unselectedColor: string;
            disabledColor: string;
            marginLeft: number;
            outline: string;
            background?: string;
            transparency: number;
            outlineColor: string;
            outlineWeight: number;
            borderStyle: string;
        };
        slicerItemContainer: {
            marginTop: number;
            marginLeft: number;
        };
        images: {
            imageSplit: number;
            stretchImage: boolean;
            bottomImage: boolean;
        };
    }

    export class ChicletSlicer implements IVisual {
        public static capabilities: VisualCapabilities = {
            dataRoles: [
                {
                    name: 'Category',
                    kind: VisualDataRoleKind.Grouping,
                    displayName: 'Category',
                },
                {
                    name: 'Values',
                    kind: VisualDataRoleKind.Measure,
                    displayName: 'Values',
                },
                {
                    name: 'Image',
                    kind: VisualDataRoleKind.Grouping,
                    displayName: 'Image',
                },
            ],
            objects: {
                general: {
                    displayName: 'General',
                    properties: {
                        selection: {
                            displayName: "Selection",
                            type: { text: true }
                        },
                        orientation: {
                            displayName: 'Orientation',
                            type: { enumeration: Orientation.type }
                        },
                        columns: {
                            displayName: 'Columns',
                            type: { numeric: true }
                        },
                        rows: {
                            displayName: 'Rows',
                            type: { numeric: true }
                        },
                        showDisabled: {
                            displayName: 'Show Disabled',
                            type: { enumeration: ChicletSlicerShowDisabled.type }
                        },
                        multiselect: {
                            displayName: 'Multiple selection',
                            type: { bool: true }
                        },
                        selected: {
                            type: { bool: true }
                        },
                        filter: {
                            type: { filter: {} }
                        },
                        selfFilter: {
                            type: { filter: { selfFilter: true } }
                        },
                        selfFilterEnabled: {
                            type: { operations: { searchEnabled: true } }
                        },
                        formatString: {
                            type: { formatting: { formatString: true } }
                        },
                    },
                },
                header: {
                    displayName: 'Header',
                    properties: {
                        show: {
                            displayName: 'Show',
                            type: { bool: true }
                        },
                        title: {
                            displayName: 'Title',
                            type: { text: true }
                        },
                        fontColor: {
                            displayName: 'Font color',
                            type: { fill: { solid: { color: true } } }
                        },
                        background: {
                            displayName: 'Background',
                            type: { fill: { solid: { color: true } } }
                        },
                        outline: {
                            displayName: 'Outline',
                            type: { formatting: { outline: true } }
                        },
                        textSize: {
                            displayName: 'Text Size',
                            type: { numeric: true }
                        },
                        outlineColor: {
                            displayName: 'Outline Color',
                            type: { fill: { solid: { color: true } } }
                        },
                        outlineWeight: {
                            displayName: 'Outline Weight',
                            type: { numeric: true }
                        }
                    }
                },
                rows: {
                    displayName: 'Chiclets',
                    properties: {
                        fontColor: {
                            displayName: 'Text color',
                            type: { fill: { solid: { color: true } } }
                        },
                        textSize: {
                            displayName: 'Text Size',
                            type: { numeric: true }
                        },
                        height: {
                            displayName: 'Height',
                            type: { numeric: true }
                        },
                        width: {
                            displayName: 'Width',
                            type: { numeric: true }
                        },
                        selectedColor: {
                            displayName: 'Selected Color',
                            type: { fill: { solid: { color: true } } }
                        },
                        hoverColor: {
                            displayName: 'Hover Color',
                            type: { fill: { solid: { color: true } } }
                        },
                        unselectedColor: {
                            displayName: 'Unselected Color',
                            type: { fill: { solid: { color: true } } }
                        },
                        disabledColor: {
                            displayName: 'Disabled Color',
                            type: { fill: { solid: { color: true } } }
                        },
                        background: {
                            displayName: 'Background',
                            type: { fill: { solid: { color: true } } }
                        },
                        transparency: {
                            displayName: "Transparency",
                            description: "Set transparency for background color",
                            type: { numeric: true }
                        },
                        outline: {
                            displayName: 'Outline',
                            type: { formatting: { outline: true } }
                        },
                        outlineColor: {
                            displayName: 'Outline Color',
                            type: { fill: { solid: { color: true } } }
                        },
                        outlineWeight: {
                            displayName: 'Outline Weight',
                            type: { numeric: true }
                        },
                        borderStyle: {
                            displayName: 'Outline Style',
                            type: { enumeration: ChicletBorderStyle.type }
                        },
                    }
                },
                images: {
                    displayName: 'Images',
                    properties: {
                        imageSplit: {
                            displayName: 'Image Split',
                            type: { numeric: true }
                        },
                        stretchImage: {
                            displayName: 'Stretch image',
                            type: { bool: true }
                        },
                        bottomImage: {
                            displayName: 'Bottom image',
                            type: { bool: true }
                        },
                    }
                },
            },
            dataViewMappings: [{
                conditions: [
                    {
                        'Category': { max: 1 },
                        'Image': { min: 0, max: 1 },
                        'Values': { min: 0, max: 1 }
                    }
                ],
                categorical: {
                    categories: {
                        for: { in: 'Category' },
                        dataReductionAlgorithm: { top: { count: 10000 } }
                    },
                    values: {
                        group: {
                            by: 'Image',
                            select: [{ bind: { to: 'Values' } }],
                            dataReductionAlgorithm: { top: { count: 10000 } }
                        }
                    },
                    includeEmptyGroups: true
                }
            }],
            supportsHighlight: true,
            sorting: {
                default: {},
            },
            suppressDefaultTitle: true,
        };

        private element: JQuery;
        private searchHeader: JQuery;
        private searchInput: JQuery;
        private currentViewport: IViewport;
        private dataView: DataView;
        private slicerHeader: Selection<any>;
        private slicerBody: Selection<any>;
        private tableView: ITableView;
        private slicerData: ChicletSlicerData;
        private settings: ChicletSlicerSettings;
        private interactivityService: IInteractivityService;
        private behavior: ChicletSlicerWebBehavior;
        private hostServices: IVisualHostServices;
        private waitingForData: boolean;
        private isSelectionLoaded: boolean;
        private isSelectionSaved: boolean;

        public static DefaultFontFamily: string = "'Segoe UI', 'wf_segoe-ui_normal', helvetica, arial, sans-serif";
        public static DefaultFontSizeInPt: number = 11;

        private static cellTotalInnerPaddings: number = 8;
        private static cellTotalInnerBorders: number = 2;
        private static chicletTotalInnerRightLeftPaddings: number = 14;

        public static MinImageSplit: number = 0;
        public static MaxImageSplit: number = 100;

        private static MinSizeOfViewport: number = 0;

        private static WidthOfScrollbar: number = 17;

        public static ItemContainerSelector: ClassAndSelector = createClassAndSelector('slicerItemContainer');
        public static SlicerImgWrapperSelector: ClassAndSelector = createClassAndSelector('slicer-img-wrapper');
        public static SlicerTextWrapperSelector: ClassAndSelector = createClassAndSelector('slicer-text-wrapper');
        public static SlicerBodyHorizontalSelector: ClassAndSelector = createClassAndSelector('slicerBody-horizontal');
        public static SlicerBodyVerticalSelector: ClassAndSelector = createClassAndSelector('slicerBody-vertical');
        public static HeaderTextSelector: ClassAndSelector = createClassAndSelector('headerText');
        public static ContainerSelector: ClassAndSelector = createClassAndSelector('chicletSlicer');
        public static LabelTextSelector: ClassAndSelector = createClassAndSelector('slicerText');
        public static HeaderSelector: ClassAndSelector = createClassAndSelector('slicerHeader');
        public static InputSelector: ClassAndSelector = createClassAndSelector('slicerCheckbox');
        public static ClearSelector: ClassAndSelector = createClassAndSelector('clear');
        public static BodySelector: ClassAndSelector = createClassAndSelector('slicerBody');

        public static DefaultStyleProperties(): ChicletSlicerSettings {
            return {
                general: {
                    orientation: Orientation.VERTICAL,
                    columns: 3,
                    rows: 0,
                    multiselect: true,
                    showDisabled: ChicletSlicerShowDisabled.INPLACE,
                    selection: null,
                    selfFilterEnabled: false
                },
                margin: {
                    top: 50,
                    bottom: 50,
                    right: 50,
                    left: 50
                },
                header: {
                    borderBottomWidth: 1,
                    show: true,
                    outline: 'BottomOnly',
                    fontColor: '#a6a6a6',
                    background: null,
                    textSize: 10,
                    outlineColor: '#a6a6a6',
                    outlineWeight: 1,
                    title: '',
                },
                headerText: {
                    marginLeft: 8,
                    marginTop: 0
                },
                slicerText: {
                    textSize: 10,
                    height: 0,
                    width: 0,
                    fontColor: '#666666',
                    hoverColor: '#212121',
                    selectedColor: '#BDD7EE',
                    unselectedColor: '#ffffff',
                    disabledColor: 'grey',
                    marginLeft: 8,
                    outline: 'Frame',
                    background: null,
                    transparency: 0,
                    outlineColor: '#000000',
                    outlineWeight: 1,
                    borderStyle: 'Cut',

                },
                slicerItemContainer: {
                    // The margin is assigned in the less file. This is needed for the height calculations.
                    marginTop: 5,
                    marginLeft: 0,
                },
                images: {
                    imageSplit: 50,
                    stretchImage: false,
                    bottomImage: false
                }
            };
        }

        constructor(options?: ChicletSlicerConstructorOptions) {
            if (options) {
                if (options.behavior) {
                    this.behavior = options.behavior;
                }
            }

            if (!this.behavior) {
                this.behavior = new ChicletSlicerWebBehavior();
            }
        }

        /**
         * Public to testability.
         */
        public static getValidImageSplit(imageSplit): number {
            if (imageSplit < ChicletSlicer.MinImageSplit) {
                return ChicletSlicer.MinImageSplit;
            } else if (imageSplit > ChicletSlicer.MaxImageSplit) {
                return ChicletSlicer.MaxImageSplit;
            } else {
                return imageSplit;
            }
        }

        public static converter(dataView: DataView, searchText: string, interactivityService: IInteractivityService): ChicletSlicerData {
            if (!dataView ||
                !dataView.categorical ||
                !dataView.categorical.categories ||
                !dataView.categorical.categories[0] ||
                !dataView.categorical.categories[0].values ||
                !(dataView.categorical.categories[0].values.length > 0)) {
                return;
            }

            var converter = new ChicletSlicerConverter(dataView, interactivityService);
            converter.convert();

            var slicerData: ChicletSlicerData,
                defaultSettings: ChicletSlicerSettings = this.DefaultStyleProperties(),
                objects: DataViewObjects = dataView.metadata.objects;

            if (objects) {
                defaultSettings.general.orientation = DataViewObjects.getValue<string>(objects, chicletSlicerProps.general.orientation, defaultSettings.general.orientation);
                defaultSettings.general.columns = DataViewObjects.getValue<number>(objects, chicletSlicerProps.general.columns, defaultSettings.general.columns);
                defaultSettings.general.rows = DataViewObjects.getValue<number>(objects, chicletSlicerProps.general.rows, defaultSettings.general.rows);
                defaultSettings.general.multiselect = DataViewObjects.getValue<boolean>(objects, chicletSlicerProps.general.multiselect, defaultSettings.general.multiselect);
                defaultSettings.general.showDisabled = DataViewObjects.getValue<string>(objects, chicletSlicerProps.general.showDisabled, defaultSettings.general.showDisabled);
                defaultSettings.general.selection = DataViewObjects.getValue(dataView.metadata.objects, chicletSlicerProps.general.selection, defaultSettings.general.selection);
                defaultSettings.general.selfFilterEnabled = DataViewObjects.getValue<boolean>(objects, chicletSlicerProps.general.selfFilterEnabled, defaultSettings.general.selfFilterEnabled);

                defaultSettings.header.show = DataViewObjects.getValue<boolean>(objects, chicletSlicerProps.header.show, defaultSettings.header.show);
                defaultSettings.header.title = DataViewObjects.getValue<string>(objects, chicletSlicerProps.header.title, defaultSettings.header.title);
                defaultSettings.header.fontColor = DataViewObjects.getFillColor(objects, chicletSlicerProps.header.fontColor, defaultSettings.header.fontColor);
                defaultSettings.header.background = DataViewObjects.getFillColor(objects, chicletSlicerProps.header.background, defaultSettings.header.background);
                defaultSettings.header.textSize = DataViewObjects.getValue<number>(objects, chicletSlicerProps.header.textSize, defaultSettings.header.textSize);
                defaultSettings.header.outline = DataViewObjects.getValue<string>(objects, chicletSlicerProps.header.outline, defaultSettings.header.outline);
                defaultSettings.header.outlineColor = DataViewObjects.getFillColor(objects, chicletSlicerProps.header.outlineColor, defaultSettings.header.outlineColor);
                defaultSettings.header.outlineWeight = DataViewObjects.getValue<number>(objects, chicletSlicerProps.header.outlineWeight, defaultSettings.header.outlineWeight);

                defaultSettings.slicerText.textSize = DataViewObjects.getValue<number>(objects, chicletSlicerProps.rows.textSize, defaultSettings.slicerText.textSize);
                defaultSettings.slicerText.height = DataViewObjects.getValue<number>(objects, chicletSlicerProps.rows.height, defaultSettings.slicerText.height);
                defaultSettings.slicerText.width = DataViewObjects.getValue<number>(objects, chicletSlicerProps.rows.width, defaultSettings.slicerText.width);
                defaultSettings.slicerText.selectedColor = DataViewObjects.getFillColor(objects, chicletSlicerProps.rows.selectedColor, defaultSettings.slicerText.selectedColor);
                defaultSettings.slicerText.hoverColor = DataViewObjects.getFillColor(objects, chicletSlicerProps.rows.hoverColor, defaultSettings.slicerText.hoverColor);
                defaultSettings.slicerText.unselectedColor = DataViewObjects.getFillColor(objects, chicletSlicerProps.rows.unselectedColor, defaultSettings.slicerText.unselectedColor);
                defaultSettings.slicerText.disabledColor = DataViewObjects.getFillColor(objects, chicletSlicerProps.rows.disabledColor, defaultSettings.slicerText.disabledColor);
                defaultSettings.slicerText.background = DataViewObjects.getFillColor(objects, chicletSlicerProps.rows.background, defaultSettings.slicerText.background);
                defaultSettings.slicerText.transparency = DataViewObjects.getValue<number>(objects, chicletSlicerProps.rows.transparency, defaultSettings.slicerText.transparency);
                defaultSettings.slicerText.fontColor = DataViewObjects.getFillColor(objects, chicletSlicerProps.rows.fontColor, defaultSettings.slicerText.fontColor);
                defaultSettings.slicerText.outline = DataViewObjects.getValue<string>(objects, chicletSlicerProps.rows.outline, defaultSettings.slicerText.outline);
                defaultSettings.slicerText.outlineColor = DataViewObjects.getFillColor(objects, chicletSlicerProps.rows.outlineColor, defaultSettings.slicerText.outlineColor);
                defaultSettings.slicerText.outlineWeight = DataViewObjects.getValue<number>(objects, chicletSlicerProps.rows.outlineWeight, defaultSettings.slicerText.outlineWeight);
                defaultSettings.slicerText.borderStyle = DataViewObjects.getValue<string>(objects, chicletSlicerProps.rows.borderStyle, defaultSettings.slicerText.borderStyle);

                defaultSettings.images.imageSplit = DataViewObjects.getValue<number>(objects, chicletSlicerProps.images.imageSplit, defaultSettings.images.imageSplit);
                defaultSettings.images.stretchImage = DataViewObjects.getValue<boolean>(objects, chicletSlicerProps.images.stretchImage, defaultSettings.images.stretchImage);
                defaultSettings.images.bottomImage = DataViewObjects.getValue<boolean>(objects, chicletSlicerProps.images.bottomImage, defaultSettings.images.bottomImage);
            }

            if (defaultSettings.general.selfFilterEnabled && searchText) {
                searchText = searchText.toLowerCase();
                converter.dataPoints.forEach(x => x.filtered = x.category.toLowerCase().indexOf(searchText) < 0);
            }

            var categories: DataViewCategoricalColumn = dataView.categorical.categories[0];

            slicerData = {
                categorySourceName: categories.source.displayName,
                formatString: valueFormatter.getFormatString(categories.source, chicletSlicerProps.formatString),
                slicerSettings: defaultSettings,
                slicerDataPoints: converter.dataPoints,
            };

            // Override hasSelection if a objects contained more scopeIds than selections we found in the data
            slicerData.hasSelectionOverride = converter.hasSelectionOverride;

            return slicerData;
        }

        public init(options: VisualInitOptions): void {
            this.element = options.element;
            this.currentViewport = options.viewport;

            if (this.behavior) {
                this.interactivityService = createInteractivityService(options.host);
            }

            this.hostServices = options.host;
            this.hostServices.canSelect = ChicletSlicer.canSelect;

            this.settings = ChicletSlicer.DefaultStyleProperties();

            this.initContainer();
        }

        private static canSelect(args: SelectEventArgs): boolean {
            var selectors = _.map(args.visualObjects, (visualObject) => {
                return Selector.convertSelectorsByColumnToSelector(visualObject.selectorsByColumn);
            });

            // We can't have multiple selections if any include more than one identity
            if (selectors && (selectors.length > 1)) {
                if (selectors.some((value: Selector) => value && value.data && value.data.length > 1)) {
                    return false;
                }
            }

            // Todo: check for cases of trying to select a category and a series (not the intersection)
            return true;
        }

        public update(options: VisualUpdateOptions) {
            if (!options ||
                !options.dataViews ||
                !options.dataViews[0] ||
                !options.viewport) {
                return;
            }

            var existingDataView = this.dataView;
            this.dataView = options.dataViews[0];

            var resetScrollbarPosition: boolean = true;
            if (existingDataView) {
                resetScrollbarPosition = !DataViewAnalysis.hasSameCategoryIdentity(existingDataView, this.dataView);
            }

            if (options.viewport.height === this.currentViewport.height
                && options.viewport.width === this.currentViewport.width) {
                this.waitingForData = false;
            }
            else {
                this.currentViewport = options.viewport;
            }

            this.updateInternal(resetScrollbarPosition);
        }

        public onResizing(finalViewport: IViewport): void {
            this.currentViewport = finalViewport;
            this.updateInternal(false /* resetScrollbarPosition */);
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            var data: ChicletSlicerData = this.slicerData;

            if (!data) {
                return;
            }

            switch (options.objectName) {
                case 'rows':
                    return this.enumerateRows(data);
                case 'header':
                    return this.enumerateHeader(data);
                case 'general':
                    return this.enumerateGeneral(data);
                case 'images':
                    return this.enumerateImages(data);
            }
        }

        private enumerateHeader(data: ChicletSlicerData): VisualObjectInstance[] {
            var slicerSettings: ChicletSlicerSettings = this.settings;

            return [{
                selector: null,
                objectName: 'header',
                properties: {
                    show: slicerSettings.header.show,
                    title: slicerSettings.header.title,
                    fontColor: slicerSettings.header.fontColor,
                    background: slicerSettings.header.background,
                    textSize: slicerSettings.header.textSize,
                    outline: slicerSettings.header.outline,
                    outlineColor: slicerSettings.header.outlineColor,
                    outlineWeight: slicerSettings.header.outlineWeight
                }
            }];
        }

        private enumerateRows(data: ChicletSlicerData): VisualObjectInstance[] {
            var slicerSettings: ChicletSlicerSettings = this.settings;

            return [{
                selector: null,
                objectName: 'rows',
                properties: {
                    textSize: slicerSettings.slicerText.textSize,
                    height: slicerSettings.slicerText.height,
                    width: slicerSettings.slicerText.width,
                    background: slicerSettings.slicerText.background,
                    transparency: slicerSettings.slicerText.transparency,
                    selectedColor: slicerSettings.slicerText.selectedColor,
                    hoverColor: slicerSettings.slicerText.hoverColor,
                    unselectedColor: slicerSettings.slicerText.unselectedColor,
                    disabledColor: slicerSettings.slicerText.disabledColor,
                    outline: slicerSettings.slicerText.outline,
                    outlineColor: slicerSettings.slicerText.outlineColor,
                    outlineWeight: slicerSettings.slicerText.outlineWeight,
                    fontColor: slicerSettings.slicerText.fontColor,
                    borderStyle: slicerSettings.slicerText.borderStyle,
                }
            }];
        }

        private enumerateGeneral(data: ChicletSlicerData): VisualObjectInstance[] {
            var slicerSettings: ChicletSlicerSettings = this.settings;

            return [{
                selector: null,
                objectName: 'general',
                properties: {
                    orientation: slicerSettings.general.orientation,
                    columns: slicerSettings.general.columns,
                    rows: slicerSettings.general.rows,
                    showDisabled: slicerSettings.general.showDisabled,
                    multiselect: slicerSettings.general.multiselect,
                    selfFilterEnabled: slicerSettings.general.selfFilterEnabled
                }
            }];
        }

        private enumerateImages(data: ChicletSlicerData): VisualObjectInstance[] {
            var slicerSettings: ChicletSlicerSettings = this.settings;

            return [{
                selector: null,
                objectName: 'images',
                properties: {
                    imageSplit: slicerSettings.images.imageSplit,
                    stretchImage: slicerSettings.images.stretchImage,
                    bottomImage: slicerSettings.images.bottomImage,
                }
            }];
        }

        private updateInternal(resetScrollbarPosition: boolean) {
            var data = ChicletSlicer.converter(
                this.dataView,
                this.searchInput.val(),
                this.interactivityService);

            if (!data) {
                this.tableView.empty();

                return;
            }

            if (this.interactivityService) {
                this.interactivityService.applySelectionStateToData(data.slicerDataPoints);
            }

            data.slicerSettings.header.outlineWeight = data.slicerSettings.header.outlineWeight < 0
                ? 0
                : data.slicerSettings.header.outlineWeight;

            data.slicerSettings.slicerText.outlineWeight = data.slicerSettings.slicerText.outlineWeight < 0
                ? 0
                : data.slicerSettings.slicerText.outlineWeight;

            data.slicerSettings.slicerText.height = data.slicerSettings.slicerText.height < 0
                ? 0
                : data.slicerSettings.slicerText.height;

            data.slicerSettings.slicerText.width = data.slicerSettings.slicerText.width < 0
                ? 0
                : data.slicerSettings.slicerText.width;

            data.slicerSettings.images.imageSplit = ChicletSlicer.getValidImageSplit(data.slicerSettings.images.imageSplit);

            data.slicerSettings.general.columns = data.slicerSettings.general.columns < 0
                ? 0
                : data.slicerSettings.general.columns;

            data.slicerSettings.general.rows = data.slicerSettings.general.rows < 0
                ? 0
                : data.slicerSettings.general.rows;

            data.slicerSettings.general.getSavedSelection = () => {
                try {
                    return JSON.parse(this.slicerData.slicerSettings.general.selection) || [];
                } catch (ex) {
                    return [];
                }
            };

            data.slicerSettings.general.setSavedSelection = (filter: SemanticFilter, selectionIds: string[]): void => {
                this.isSelectionSaved = true;
                this.hostServices.persistProperties(<VisualObjectInstancesToPersist>{
                    merge: [{
                        objectName: "general",
                        selector: null,
                        properties: {
                            filter: filter,
                            selection: selectionIds && JSON.stringify(selectionIds) || ""
                        }
                    }]
                });
            };

            if (this.slicerData) {
                if (this.isSelectionSaved) {
                    this.isSelectionLoaded = true;
                } else {
                    this.isSelectionLoaded = this.slicerData.slicerSettings.general.selection === data.slicerSettings.general.selection;
                }
            } else {
                this.isSelectionLoaded = false;
            }

            this.slicerData = data;
            this.settings = this.slicerData.slicerSettings;

            this.updateSlicerBodyDimensions();

            if (this.settings.general.showDisabled === ChicletSlicerShowDisabled.BOTTOM) {
                data.slicerDataPoints.sort(function (a, b) {
                    if (a.selectable === b.selectable) {
                        return 0;
                    } else if (a.selectable && !b.selectable) {
                        return -1;
                    } else {
                        return 1;
                    }
                });
            } else if (this.settings.general.showDisabled === ChicletSlicerShowDisabled.HIDE) {
                data.slicerDataPoints = data.slicerDataPoints.filter(x => x.selectable);
            }

            var height: number = this.settings.slicerText.height;

            if (height === 0) {
                var extraSpaceForCell = ChicletSlicer.cellTotalInnerPaddings + ChicletSlicer.cellTotalInnerBorders,
                    textProperties = ChicletSlicer.getChicletTextProperties(this.settings.slicerText.textSize);

                height = TextMeasurementService.estimateSvgTextHeight(textProperties) +
                    TextMeasurementService.estimateSvgTextBaselineDelta(textProperties) +
                    extraSpaceForCell;

                var hasImage: boolean = _.some(data.slicerDataPoints, (dataPoint: ChicletSlicerDataPoint) => {
                    return dataPoint.imageURL !== '' && typeof dataPoint.imageURL !== "undefined";
                });

                if (hasImage) {
                    height += 100;
                }
            }

            this.tableView
                .rowHeight(height)
                .columnWidth(this.settings.slicerText.width)
                .orientation(this.settings.general.orientation)
                .rows(this.settings.general.rows)
                .columns(this.settings.general.columns)
                .data(
                    data.slicerDataPoints.filter(x => !x.filtered),
                    (d: ChicletSlicerDataPoint) => $.inArray(d, data.slicerDataPoints),
                    resetScrollbarPosition)
                .viewport(this.getSlicerBodyViewport(this.currentViewport))
                .render();

            this.updateSearchHeader();
        }

        private initContainer() {
            var settings: ChicletSlicerSettings = this.settings,
                slicerBodyViewport: IViewport = this.getSlicerBodyViewport(this.currentViewport);

            var slicerContainer: Selection<any> = d3.select(this.element.get(0))
                .append('div')
                .classed(ChicletSlicer.ContainerSelector.class, true);

            this.slicerHeader = slicerContainer
                .append('div')
                .classed(ChicletSlicer.HeaderSelector.class, true);

            this.slicerHeader
                .append('span')
                .classed(ChicletSlicer.ClearSelector.class, true)
                .attr('title', 'Clear');

            this.slicerHeader
                .append('div')
                .classed(ChicletSlicer.HeaderTextSelector.class, true)
                .style({
                    'margin-left': PixelConverter.toString(settings.headerText.marginLeft),
                    'margin-top': PixelConverter.toString(settings.headerText.marginTop),
                    'border-style': this.getBorderStyle(settings.header.outline),
                    'border-color': settings.header.outlineColor,
                    'border-width': this.getBorderWidth(settings.header.outline, settings.header.outlineWeight),
                    'font-size': PixelConverter.fromPoint(settings.header.textSize),
                });

            this.createSearchHeader($(slicerContainer.node()));

            this.slicerBody = slicerContainer
                .append('div')
                .classed(ChicletSlicer.BodySelector.class, true)
                .classed(
                    ChicletSlicer.SlicerBodyHorizontalSelector.class,
                    settings.general.orientation === Orientation.HORIZONTAL)
                .classed(
                    ChicletSlicer.SlicerBodyVerticalSelector.class,
                    settings.general.orientation === Orientation.VERTICAL
                )
                .style({
                    'height': PixelConverter.toString(slicerBodyViewport.height),
                    'width': '100%',
                });

            var rowEnter = (rowSelection: Selection<any>) => {
                this.enterSelection(rowSelection);
            };

            var rowUpdate = (rowSelection: Selection<any>) => {
                this.updateSelection(rowSelection);
            };

            var rowExit = (rowSelection: Selection<any>) => {
                rowSelection.remove();
            };

            var tableViewOptions: TableViewViewOptions = {
                rowHeight: this.getRowHeight(),
                columnWidth: this.settings.slicerText.width,
                orientation: this.settings.general.orientation,
                rows: this.settings.general.rows,
                columns: this.settings.general.columns,
                enter: rowEnter,
                exit: rowExit,
                update: rowUpdate,
                loadMoreData: () => this.onLoadMoreData(),
                scrollEnabled: true,
                viewport: this.getSlicerBodyViewport(this.currentViewport),
                baseContainer: this.slicerBody,
            };

            this.tableView = TableViewFactory.createTableView(tableViewOptions);
        }

        private enterSelection (rowSelection: Selection<any>): void {
            var settings: ChicletSlicerSettings = this.settings;

            var ulItemElement = rowSelection
                .selectAll('ul')
                .data((dataPoint: ChicletSlicerDataPoint) => {
                    return [dataPoint];
                });

            ulItemElement
                .enter()
                .append('ul');

            ulItemElement
                .exit()
                .remove();

            var listItemElement = ulItemElement
                .selectAll(ChicletSlicer.ItemContainerSelector.selector)
                .data((dataPoint: ChicletSlicerDataPoint) => {
                    return [dataPoint];
                });

            listItemElement
                .enter()
                .append('li')
                .classed(ChicletSlicer.ItemContainerSelector.class, true);

            listItemElement.style({
                'margin-left': PixelConverter.toString(settings.slicerItemContainer.marginLeft)
            });

            var slicerImgWrapperSelection: UpdateSelection<any> = listItemElement
                .selectAll(ChicletSlicer.SlicerImgWrapperSelector.selector)
                .data((dataPoint: ChicletSlicerDataPoint) => {
                    return [dataPoint];
                });

            slicerImgWrapperSelection
                .enter()
                .append('img')
                .classed(ChicletSlicer.SlicerImgWrapperSelector.class, true);

            slicerImgWrapperSelection
                .exit()
                .remove();

            var slicerTextWrapperSelection: UpdateSelection<any> = listItemElement
                .selectAll(ChicletSlicer.SlicerTextWrapperSelector.selector)
                .data((dataPoint: ChicletSlicerDataPoint) => {
                    return [dataPoint];
                });

            slicerTextWrapperSelection
                .enter()
                .append('div')
                .classed(ChicletSlicer.SlicerTextWrapperSelector.class, true);

            var labelTextSelection: UpdateSelection<any> = slicerTextWrapperSelection
                .selectAll(ChicletSlicer.LabelTextSelector.selector)
                .data((dataPoint: ChicletSlicerDataPoint) => {
                    return [dataPoint];
                });

            labelTextSelection
                .enter()
                .append('span')
                .classed(ChicletSlicer.LabelTextSelector.class, true);

            labelTextSelection.style({
                'font-size': PixelConverter.fromPoint(settings.slicerText.textSize),
            });

            labelTextSelection
                .exit()
                .remove();

            slicerTextWrapperSelection
                .exit()
                .remove();

            listItemElement
                .exit()
                .remove();
        };

        private updateSelection(rowSelection: Selection<any>): void {
            var settings: ChicletSlicerSettings = this.settings,
                data: ChicletSlicerData = this.slicerData;

            if (data && settings) {
                this.slicerHeader
                    .classed('hidden', !settings.header.show);

                this.slicerHeader
                    .select(ChicletSlicer.HeaderTextSelector.selector)
                    .text(settings.header.title.trim() !== ""
                        ? settings.header.title.trim()
                        : this.slicerData.categorySourceName)
                    .style({
                        'border-style': this.getBorderStyle(settings.header.outline),
                        'border-color': settings.header.outlineColor,
                        'border-width': this.getBorderWidth(settings.header.outline, settings.header.outlineWeight),
                        'color': settings.header.fontColor,
                        'background-color': settings.header.background,
                        'font-size': PixelConverter.fromPoint(settings.header.textSize),
                    });

                this.slicerBody
                    .classed(
                        ChicletSlicer.SlicerBodyHorizontalSelector.class,
                        settings.general.orientation === Orientation.HORIZONTAL)
                    .classed(
                        ChicletSlicer.SlicerBodyVerticalSelector.class,
                        settings.general.orientation === Orientation.VERTICAL);

                var slicerText: Selection<any> = rowSelection.selectAll(ChicletSlicer.LabelTextSelector.selector),
                    textProperties: TextProperties = ChicletSlicer.getChicletTextProperties(settings.slicerText.textSize),
                    formatString: string = data.formatString;

                slicerText.text((d: ChicletSlicerDataPoint) => {
                    var maxWidth: number = 0;

                    textProperties.text = valueFormatter.format(d.category, formatString);

                    if (this.settings.slicerText.width === 0) {
                        var slicerBodyViewport: IViewport = this.getSlicerBodyViewport(this.currentViewport);

                        maxWidth = (slicerBodyViewport.width / (this.tableView.computedColumns || 1)) -
                            ChicletSlicer.chicletTotalInnerRightLeftPaddings -
                            ChicletSlicer.cellTotalInnerBorders -
                            settings.slicerText.outlineWeight;

                        return TextMeasurementService.getTailoredTextOrDefault(textProperties, maxWidth);
                    }
                    else {
                        maxWidth = this.settings.slicerText.width -
                            ChicletSlicer.chicletTotalInnerRightLeftPaddings -
                            ChicletSlicer.cellTotalInnerBorders -
                            settings.slicerText.outlineWeight;

                        return TextMeasurementService.getTailoredTextOrDefault(textProperties, maxWidth);
                    }
                });

                rowSelection
                    .selectAll(ChicletSlicer.SlicerImgWrapperSelector.selector)
                    .style({
                        'max-height': settings.images.imageSplit + '%',
                        'display': (dataPoint: ChicletSlicerDataPoint) => (dataPoint.imageURL)
                            ? 'flex'
                            : 'none'
                    })
                    .classed({
                        'hidden': (dataPoint: ChicletSlicerDataPoint) => {
                            if (!(dataPoint.imageURL)) {
                                return true;
                            }

                            if (settings.images.imageSplit < 10) {
                                return true;
                            }
                        },
                        'stretchImage': settings.images.stretchImage,
                        'bottomImage': settings.images.bottomImage
                    })
                    .attr('src', (d: ChicletSlicerDataPoint) => {
                        return d.imageURL ? d.imageURL : '';
                    });

                rowSelection.selectAll('.slicer-text-wrapper')
                    .style('height', (d: ChicletSlicerDataPoint) => {
                        return d.imageURL
                            ? (100 - settings.images.imageSplit) + '%'
                            : '100%';
                    })
                    .classed('hidden', (d: ChicletSlicerDataPoint) => {
                        if (settings.images.imageSplit > 90) {
                            return true;
                        }
                    });

                rowSelection.selectAll('.slicerItemContainer').style({
                    'color': settings.slicerText.fontColor,
                    'border-style': this.getBorderStyle(settings.slicerText.outline),
                    'border-color': settings.slicerText.outlineColor,
                    'border-width': this.getBorderWidth(settings.slicerText.outline, settings.slicerText.outlineWeight),
                    'font-size': PixelConverter.fromPoint(settings.slicerText.textSize),
                    'border-radius': this.getBorderRadius(settings.slicerText.borderStyle),
                });

                if (settings.slicerText.background) {
                    var backgroundColor: string = hexToRGBString(
                        settings.slicerText.background,
                        (100 - settings.slicerText.transparency) / 100);

                    this.slicerBody.style('background-color', backgroundColor);
                }
                else {
                    this.slicerBody.style('background-color', null);
                }

                if (this.interactivityService && this.slicerBody) {
                    this.interactivityService.applySelectionStateToData(data.slicerDataPoints);

                    var slicerBody: Selection<any> = this.slicerBody.attr('width', this.currentViewport.width),
                        slicerItemContainers: Selection<any> = slicerBody.selectAll(ChicletSlicer.ItemContainerSelector.selector),
                        slicerItemLabels: Selection<any> = slicerBody.selectAll(ChicletSlicer.LabelTextSelector.selector),
                        slicerItemInputs: Selection<any> = slicerBody.selectAll(ChicletSlicer.InputSelector.selector),
                        slicerClear: Selection<any> = this.slicerHeader.select(ChicletSlicer.ClearSelector.selector);

                    var behaviorOptions: ChicletSlicerBehaviorOptions = {
                        dataPoints: data.slicerDataPoints,
                        slicerItemContainers: slicerItemContainers,
                        slicerItemLabels: slicerItemLabels,
                        slicerItemInputs: slicerItemInputs,
                        slicerClear: slicerClear,
                        interactivityService: this.interactivityService,
                        slicerSettings: data.slicerSettings,
                        isSelectionLoaded: this.isSelectionLoaded
                    };

                    this.interactivityService.bind(data.slicerDataPoints, this.behavior, behaviorOptions, {
                        overrideSelectionFromData: true,
                        hasSelectionOverride: data.hasSelectionOverride,
                    });

                    this.behavior.styleSlicerInputs(
                        rowSelection.select(ChicletSlicer.ItemContainerSelector.selector),
                        this.interactivityService.hasSelection());
                }
                else {
                    this.behavior.styleSlicerInputs(rowSelection.select(ChicletSlicer.ItemContainerSelector.selector), false);
                }
            }
        };

        private createSearchHeader(container: JQuery): void {
            this.searchHeader = $("<div>")
                .appendTo(container)
                .addClass("searchHeader")
                .addClass("collapsed");

            $("<div>").appendTo(this.searchHeader)
                .attr("title", "Search")
                .addClass("search");

            var counter = 0;
            this.searchInput = $("<input>").appendTo(this.searchHeader)
                .attr("type", "text")
                .attr("drag-resize-disabled", "true")
                .addClass("searchInput")
                .on("input", () => this.hostServices.persistProperties(<VisualObjectInstancesToPersist>{
                    merge: [{
                        objectName: "general",
                        selector: null,
                        properties: {
                            counter: counter++
                        }
                    }]
                }));
        }

        private updateSearchHeader(): void {
            this.searchHeader.toggleClass("show", this.slicerData.slicerSettings.general.selfFilterEnabled);
            this.searchHeader.toggleClass("collapsed", !this.slicerData.slicerSettings.general.selfFilterEnabled);
        }

        private onLoadMoreData(): void {
            if (!this.waitingForData && this.dataView.metadata && this.dataView.metadata.segment) {
                this.hostServices.loadMoreData();
                this.waitingForData = true;
            }
        }

        private getSlicerBodyViewport(currentViewport: IViewport): IViewport {
            var settings: ChicletSlicerSettings = this.settings,
                headerHeight: number = (settings.header.show) ? this.getHeaderHeight() : 0,
                borderHeight: number = settings.header.outlineWeight,
                height: number = currentViewport.height - (headerHeight + borderHeight + settings.header.borderBottomWidth),
                width: number = currentViewport.width - ChicletSlicer.WidthOfScrollbar;

            return {
                height: Math.max(height, ChicletSlicer.MinSizeOfViewport),
                width: Math.max(width, ChicletSlicer.MinSizeOfViewport)
            };
        }

        private updateSlicerBodyDimensions(): void {
            var slicerViewport: IViewport = this.getSlicerBodyViewport(this.currentViewport);
            this.slicerBody
                .style({
                    'height': PixelConverter.toString(slicerViewport.height),
                    'width': '100%',
                });
        }

        public static getChicletTextProperties(textSize?: number): TextProperties {
            return <TextProperties>{
                fontFamily: ChicletSlicer.DefaultFontFamily,
                fontSize: PixelConverter.fromPoint(textSize || ChicletSlicer.DefaultFontSizeInPt),
            };
        }

        private getHeaderHeight(): number {
            return TextMeasurementService.estimateSvgTextHeight(
                ChicletSlicer.getChicletTextProperties(this.settings.header.textSize));
        }

        private getRowHeight(): number {
            var textSettings = this.settings.slicerText;
            return textSettings.height !== 0
                ? textSettings.height
                : TextMeasurementService.estimateSvgTextHeight(ChicletSlicer.getChicletTextProperties(textSettings.textSize));
        }

        private getBorderStyle(outlineElement: string): string {
            return outlineElement === '0px' ? 'none' : 'solid';
        }

        private getBorderWidth(outlineElement: string, outlineWeight: number): string {
            switch (outlineElement) {
                case 'None':
                    return '0px';
                case 'BottomOnly':
                    return '0px 0px ' + outlineWeight + 'px 0px';
                case 'TopOnly':
                    return outlineWeight + 'px 0px 0px 0px';
                case 'TopBottom':
                    return outlineWeight + 'px 0px ' + outlineWeight + 'px 0px';
                case 'LeftRight':
                    return '0px ' + outlineWeight + 'px 0px ' + outlineWeight + 'px';
                case 'Frame':
                    return outlineWeight + 'px';
                default:
                    return outlineElement.replace("1", outlineWeight.toString());
            }
        }

        private getBorderRadius(borderType: string): string {
            switch (borderType) {
                case ChicletBorderStyle.ROUNDED:
                    return "10px";
                case ChicletBorderStyle.SQUARE:
                    return "0px";
                default:
                    return "5px";
            }
        }
    }

}
